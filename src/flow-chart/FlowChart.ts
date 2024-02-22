/* eslint-disable class-methods-use-this, @typescript-eslint/no-explicit-any,@typescript-eslint/ban-ts-comment */

/**
 * FcNode 流程图节点，逻辑概念 IFcNode
 *
 * FcElement 流程图节点元素，HTMLElement
 */

import type {
  Connection as IJsPlumbConnection,
} from '@jsplumb/browser-ui/types/core/connector/connection-impl';

import interact from 'interactjs';
import lodashGet from 'lodash.get';
import lodashMerge from 'lodash.merge';
import jQuery from 'jquery';
import throttle from 'lodash.throttle';

import {
  AnchorLocations,
  BrowserJsPlumbInstance,
  Connection as JsPlumbConnection,
  LabelOverlay,
  newInstance,
} from '@jsplumb/browser-ui';

import {
  IFcAnchor,
  IFcConfig,
  IFcConnection,
  IFcNode,
  IFcNodeType,
  IFcOptions,
} from '@/commons/configs/types';

import {
  BIZ_IDS_HIGHLIGHT,
  BIZ_IDS_HIGHLIGHT_DEFAULT_VALUE,
  CIRCLE_NODE_TYPE,
  DIAMOND_NODE_TYPE,
  RECTANGLE_NODE_TYPE,
  STEP_INDEX_HIGHLIGHT,
  STEP_INDEX_HIGHLIGHT_DEFAULT_VALUE,
} from '@/commons/configs/commons';

import { toFixedNumber } from '@/commons/utils/number';

import {
  BIZ_ID_ATTR_NAME, CONTENT_EDITABLE_ATTR_NAME,
  DEFAULT_BIZ_ID_ATTR_VALUE,
  DEFAULT_SORT_ATTR_VALUE,
  DEFAULT_STEP_INDEX_ATTR_VALUE,
  EVENT_NAMESPACE,
  DOM_EVENTS,
  FC_CONNECTION_TYPE,
  FC_CSS_CLASS_NAMES, GET_DEFAULT_OPTIONS,
  JS_PLUMB_DEFAULTS,
  NODE_HTML_RENDER,
  NODE_SKELETON_HTML_RENDER,
  SORT_ATTR_NAME,
  STEP_INDEX_ATTR_NAME, CUSTOM_EVENTS,
} from '@/commons/configs/constants';
import clonedeep from 'lodash.clonedeep';

export type IJQuery = JQuery<HTMLElement>;

export class FlowChart {
  /** stage element  */
  private el: HTMLElement;

  private $stage: IJQuery;

  private jsPlumbInstance: BrowserJsPlumbInstance;

  private eventHandlers = {
    [CUSTOM_EVENTS.SELECT_NODE]: [] as Array<(payload: IFcNode) => void>,
    [CUSTOM_EVENTS.UNSELECT_NODE]: [] as Array<() => void>,
    [CUSTOM_EVENTS.SELECT_CONNECTION]: [] as Array<(payload: IFcConnection) => void>,
    [CUSTOM_EVENTS.UNSELECT_CONNECTION]: [] as Array<() => void>,
    [CUSTOM_EVENTS.UNSELECT_ALL]: [] as Array<() => void>,
    [CUSTOM_EVENTS.STAGE_SCALE_CHANGED]: [] as Array<(scale: number) => void>,
    [CUSTOM_EVENTS.STAGE_MOVE]: [] as Array<(offset: { x: number, y: number }) => void>,
    [CUSTOM_EVENTS.FLOWCHART_OPTIONS_CHANGED]: [] as Array<(options: IFcOptions) => void>,
  };

  private options: Required<IFcOptions>;

  constructor(el: HTMLElement, options?: IFcOptions) {
    this.el = el;

    this.$stage = jQuery(el);

    this.options = lodashMerge(GET_DEFAULT_OPTIONS(), options);

    this.jsPlumbInstance = this.createJsPlumbInstance();

    this.init();
  }

  private createJsPlumbInstance() {
    return newInstance({
      container: this.el,
    });
  }

  init(options?: IFcOptions) {
    this.options = lodashMerge({}, this.options, options);

    this.importDefaults();

    this.buildFlowChart();

    this.bindListeners();

    this.updateHighlights();

    this.updateStageScaleAndOffset();

    this.updateNodeDraggable();
  }

  private importDefaults() {
    const options = JS_PLUMB_DEFAULTS();

    this.jsPlumbInstance.importDefaults(options);
  }

  private buildFlowChart() {
    const { config } = this.options;

    if (config == null) {
      console.warn('this.options.config is None');
      return;
    }

    const { nodes, connections } = config;

    this.createFcNodes(nodes);

    this.createFcConnections(connections);

    this.updateVisibleOfEndpoints();
  }

  private createFcNodes(fcNodes: IFcNode[]) {
    for (let i = 0, len = fcNodes.length; i < len; i += 1) {
      this.createFcNode(fcNodes[i]);
    }
  }

  createFcNode(fcNode: IFcNode) {
    const {
      id,
      type,
      bizId,
      stepIndex = DEFAULT_STEP_INDEX_ATTR_VALUE,
      sort = DEFAULT_SORT_ATTR_VALUE,
      content,
      position,
    } = fcNode;

    const html = NODE_HTML_RENDER({
      type: type.toLowerCase(),
      bizId,
      stepIndex,
      sort,
      content,
      position,
    });

    const el = this.getElementFromJqueryObject(jQuery(html));

    this.createFcNodeWithElement(el, id);
  }

  createFcNodeWithElement(el: HTMLElement, managedId?: string) {
    this.el.appendChild(el);

    this.jsPlumbInstance.manage(el, managedId);

    this.createEndpointsForFcNode(el);
  }

  private createEndpointsForFcNode(el: HTMLElement) {
    this.jsPlumbInstance.addEndpoints(el, [
      {
        source: true, target: true, anchor: AnchorLocations.Top, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Right, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Bottom, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Left, maxConnections: -1,
      },
    ]);
  }

  private createFcConnections(fcConnections: IFcConnection[]) {
    for (let i = 0, len = fcConnections.length; i < len; i += 1) {
      this.createFcConnection(fcConnections[i]);
    }
  }

  private createFcConnection(fcConnection: IFcConnection) {
    const {
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label,
    } = fcConnection;

    this.jsPlumbInstance.connect({
      source: this.getElementByManagedId(sourceId),
      target: this.getElementByManagedId(targetId),
      anchors: [sourceAnchor, targetAnchor],
      overlays: [
        {
          type: LabelOverlay.type,
          options: {
            label,
          },
        },
      ],
    });
  }

  private getElementByManagedId(id: string) {
    return this.jsPlumbInstance.getManagedElement(id) as HTMLElement;
  }

  updateVisibleOfEndpoints() {
    const { show } = this.options.node.endpoint;

    if (!show) {
      this.$stage.removeClass(FC_CSS_CLASS_NAMES.EndpointVisible);
      return;
    }

    this.$stage.addClass(FC_CSS_CLASS_NAMES.EndpointVisible);
  }

  private bindListeners() {
    this.bindNormalEventListeners();
    this.bindDragStage();
  }

  private bindNormalEventListeners() {
    this.bindMousedownListener();

    this.bindDoubleClickListener();

    this.bindMouseWheelListener();
  }

  private bindMousedownListener() {
    const debouncedMousedownHandler = throttle((event: JQuery.TriggeredEvent) => {
      const { target } = event;

      this.removeSelectedCssClass();

      const $fcNode = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onClickNode($fcNode);
        this.emit(CUSTOM_EVENTS.SELECT_NODE, this.getFcNodeConfig(this.getElementFromJqueryObject($fcNode)));
        this.emit(CUSTOM_EVENTS.UNSELECT_CONNECTION);
        return;
      }

      const $fcConnection = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Connection);

      if ($fcConnection) {
        this.onClickConnection($fcConnection);

        const jsPlumbConnection = this.getSelectedJsPlumbConnection();
        const fcConnection = jsPlumbConnection ? this.getFcConnectionConfig(jsPlumbConnection) : null;

        this.emit(CUSTOM_EVENTS.SELECT_CONNECTION, fcConnection);
        this.emit(CUSTOM_EVENTS.UNSELECT_NODE);

        return;
      }

      this.emit(CUSTOM_EVENTS.UNSELECT_ALL);
      this.emit(CUSTOM_EVENTS.UNSELECT_CONNECTION);
      this.emit(CUSTOM_EVENTS.UNSELECT_NODE);
    }, 200, { trailing: false });

    this.$stage
      .on(DOM_EVENTS.MOUSEDOWN, debouncedMousedownHandler);
  }

  private isContainTarget(target: HTMLElement, cssClassName: string) {
    const $target = jQuery(target);
    const cssClassSelector = this.getCssClassSelector(cssClassName);

    if ($target.is(cssClassSelector)) {
      return $target;
    }

    const $ancestor = $target.closest(cssClassSelector);

    if (!this.isExistElement($ancestor)) {
      return null;
    }

    return $ancestor;
  }

  private getCssClassSelector(cssClassName: string) {
    return cssClassName.startsWith('.') ? cssClassName : `.${cssClassName}`;
  }

  private isExistElement(jqueryObject: IJQuery) {
    return jqueryObject.length > 0;
  }

  private getElementFromJqueryObject(jqObject: IJQuery) {
    return jqObject.get(0) as HTMLElement;
  }

  private removeSelectedCssClass() {
    const selector = `.${FC_CSS_CLASS_NAMES.Node}, .${FC_CSS_CLASS_NAMES.Connection}`;

    this.$stage
      .find(selector)
      .removeClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickNode($fcNode: IJQuery) {
    this.addSelectedCssClass($fcNode);

    // add skeleton element
    const hasSkeleton = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeSkeleton}`).length > 0;

    if (hasSkeleton) {
      return;
    }

    $fcNode.append(NODE_SKELETON_HTML_RENDER({}));
  }

  private bindDoubleClickListener() {
    const dblclickHandler = (event: JQuery.TriggeredEvent) => {
      const { target } = event;

      const $fcNode = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onDoubleClickNode($fcNode);
      }
    };

    this.$stage
      .on(DOM_EVENTS.DBLCLICK, dblclickHandler);
  }

  private onDoubleClickNode($fcNode: IJQuery) {
    const $nodeText = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeContent}`);

    $nodeText
      .prop(CONTENT_EDITABLE_ATTR_NAME, 'true')
      .trigger(DOM_EVENTS.FOCUS)
      .one(DOM_EVENTS.BLUR, () => {
        console.log(DOM_EVENTS.BLUR);
        $nodeText.removeAttr(CONTENT_EDITABLE_ATTR_NAME);
      });
  }

  private bindMouseWheelListener() {
    const mousewheelHandler = (event: JQuery.TriggeredEvent) => {
      event.stopPropagation();

      if (this.options.stage.scale.wheelWithAlt && !event.altKey) {
        return;
      }

      event.preventDefault();

      const wheelEvent = event.originalEvent as WheelEvent;
      const { deltaY } = wheelEvent;

      if (deltaY < 0) {
        this.decreaseScale();
      } else {
        this.increaseScale();
      }

      this.emit(CUSTOM_EVENTS.STAGE_SCALE_CHANGED, this.options.stage.scale.value);
    };

    jQuery(this.el.parentElement as HTMLElement)
      .on(DOM_EVENTS.WHEEL, mousewheelHandler);
  }

  decreaseScale() {
    const {
      value: scale,
      step: scaleStep,
      min: minScale,
    } = this.options.stage.scale;

    if (scale <= minScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale - scaleStep);

    this.updateStageScaleAndOffset();
  }

  increaseScale() {
    const {
      value: scale,
      step: scaleStep,
      max: maxScale,
    } = this.options.stage.scale;

    if (scale >= maxScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale + scaleStep);

    this.updateStageScaleAndOffset();
  }

  updateStageScaleAndOffset() {
    const {
      scale: { value: scale },
      offset: { x, y },
    } = this.options.stage;

    this.el.style.transform = `scale(${scale}) translateX(${x}px) translateY(${y}px)`;

    this.jsPlumbInstance.setZoom(scale);
  }

  setNodeDraggable(draggable: boolean) {
    this.options.node.draggable = draggable;
    this.updateNodeDraggable();
  }

  updateNodeDraggable() {
    this.jsPlumbInstance.elementsDraggable = this.options.node.draggable;
  }

  private bindDragStage() {
    const stageElement = this.el;
    const stageContainerElement = stageElement.parentElement as HTMLElement;

    let isStageMovable = false;

    const status = {
      mouseoverStage: false,
      mouseoverContainer: false,
    };

    jQuery(stageContainerElement)
      .on(DOM_EVENTS.MOUSEOVER, (event: JQuery.TriggeredEvent) => {
        const { target } = event;
        if (target === stageElement) {
          status.mouseoverStage = true;
          status.mouseoverContainer = false;
        } else if (target === stageContainerElement) {
          status.mouseoverStage = false;
          status.mouseoverContainer = true;
        } else {
          status.mouseoverStage = false;
          status.mouseoverContainer = false;
        }
      })
      .on(DOM_EVENTS.MOUSELEAVE, (event: JQuery.TriggeredEvent) => {
        const { target } = event;
        if (target === stageElement) {
          status.mouseoverStage = false;
        } else if (target === stageContainerElement) {
          status.mouseoverContainer = false;
        }
      });

    interact(stageContainerElement)
      .draggable({
        autoScroll: true,
        cursorChecker: () => 'default',
        listeners: {
          start: () => {
            isStageMovable = status.mouseoverStage || status.mouseoverContainer;
          },
          move: (event) => {
            const { dx, dy } = event;

            if (!isStageMovable) {
              return;
            }

            if (this.jsPlumbInstance.currentlyDragging) {
              return;
            }

            this.options.stage.offset.x += dx;
            this.options.stage.offset.y += dy;

            this.emit(CUSTOM_EVENTS.STAGE_MOVE, this.options.stage.offset);

            this.updateStageScaleAndOffset();
          },
        },
      });
  }

  updateHighlights() {
    const { type } = this.options.highlight;

    if (type === STEP_INDEX_HIGHLIGHT) {
      this.updateStepIndexHighlights();
      return;
    }

    if (type === BIZ_IDS_HIGHLIGHT) {
      this.updateBizIdsHighlights();
    }
  }

  updateStepIndexHighlights() {
    const { value } = this.options.highlight;
    const nodes = this.getAllFcNodes();
    const currentStepIndex = value as number;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      if (currentStepIndex === STEP_INDEX_HIGHLIGHT_DEFAULT_VALUE) {
        this.setHighlightOfFcNode(node, true);
      } else {
        const stepIndex = this.getStepIndexOfFcElement(node);
        const isHighlight = stepIndex <= currentStepIndex;

        this.setHighlightOfFcNode(node, isHighlight);
      }
    }
  }

  updateBizIdsHighlights() {
    const { value } = this.options.highlight;
    const nodes = this.getAllFcNodes();
    const bizIds = value as string[];

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      const bizId = this.getBizIdOfFcElement(node);
      const isHighlight = bizIds.includes(bizId);

      this.setHighlightOfFcNode(node, isHighlight);
    }
  }

  setHighlightOfFcNode(el: HTMLElement | IJQuery, isHighlight = true) {
    const $el = el instanceof HTMLElement ? jQuery(el) : el;

    if (isHighlight) {
      $el.removeClass(FC_CSS_CLASS_NAMES.Disabled);
      return;
    }

    $el.addClass(FC_CSS_CLASS_NAMES.Disabled);
  }

  private addSelectedCssClass($el: IJQuery) {
    $el.addClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickConnection(connection: IJQuery | JsPlumbConnection) {
    if (connection instanceof JsPlumbConnection) {
      console.log(connection);
    } else {
      this.addSelectedCssClass(connection);
    }
  }

  getOptions() {
    return this.options;
  }

  updateOptions(options: Partial<IFcOptions>) {
    lodashMerge(this.options, options);

    this.emit(CUSTOM_EVENTS.FLOWCHART_OPTIONS_CHANGED, clonedeep(this.options));
  }

  getStageElement() {
    return this.el;
  }

  getFlowChartConfig(): IFcConfig {
    const nodes = this.getFcNodeConfigs();
    const connections = this.getFcConnectionConfigs();

    return { nodes, connections };
  }

  private getFcNodeConfigs() {
    const nodes = this.getAllFcNodes();

    const fcNodes: IFcNode[] = [];

    nodes.forEach((el) => {
      fcNodes.push(this.getFcNodeConfig(el));
    });

    fcNodes.sort((prev, curr) => prev.sort - curr.sort);

    return fcNodes;
  }

  private getAllFcNodes() {
    const $nodes = this.$stage.find(this.getCssClassSelector(FC_CSS_CLASS_NAMES.Node));
    return Array.from($nodes);
  }

  private getFcConnectionConfigs() {
    const fcConnections: IFcConnection[] = [];
    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as IJsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];
      fcConnections.push(this.getFcConnectionConfig(jsPlumbConnection));
    }

    return fcConnections;
  }

  private getFcConnectionConfig(jsPlumbConnection: IJsPlumbConnection) {
    const { sourceId, targetId } = jsPlumbConnection;

    const sourceAnchor = lodashGet(jsPlumbConnection, 'endpoints.0._anchor.type') as IFcAnchor;
    const targetAnchor = lodashGet(jsPlumbConnection, 'endpoints.1._anchor.type') as IFcAnchor;

    const label = this.getLabelOfJsplumbConnection(jsPlumbConnection);

    return {
      type: FC_CONNECTION_TYPE,
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label,
    };
  }

  getLabelOfJsplumbConnection(jsPlumbConnection: IJsPlumbConnection) {
    const labelOverlay = this.getLabelOverlayOfJsPlumbConnection(jsPlumbConnection);

    if (!labelOverlay) {
      return '';
    }

    return labelOverlay.labelText;
  }

  private getLabelOverlayOfJsPlumbConnection(jsPlumbConnection: IJsPlumbConnection) {
    const overlays = Object.values(jsPlumbConnection.getOverlays());

    const labelOverlay = overlays.find((item) => item instanceof LabelOverlay);

    if (!labelOverlay) {
      return null;
    }

    return labelOverlay as LabelOverlay;
  }

  getFcNodeConfig(el: HTMLElement): IFcNode {
    const id = this.jsPlumbInstance.getId(el);
    const bizId = this.getBizIdOfFcElement(el);
    const type = this.getTypeOfFcElement(el);
    const { html: content, text } = this.getContentOfFcElement(el);
    const position = this.getPositionOfFcElement(el);
    const stepIndex = this.getStepIndexOfFcElement(el);
    const sort = this.getSortOfFcElement(el);

    return {
      id, bizId, type, content, text, position, stepIndex, sort,
    };
  }

  private getTypeOfFcElement(el: HTMLElement): IFcNodeType {
    if (el.classList.contains(FC_CSS_CLASS_NAMES.Circle)) {
      return CIRCLE_NODE_TYPE;
    }

    if (el.classList.contains(FC_CSS_CLASS_NAMES.Diamond)) {
      return DIAMOND_NODE_TYPE;
    }

    return RECTANGLE_NODE_TYPE;
  }

  private getBizIdOfFcElement(el: HTMLElement) {
    return jQuery(el).attr(BIZ_ID_ATTR_NAME) || DEFAULT_BIZ_ID_ATTR_VALUE;
  }

  private getStepIndexOfFcElement(el: HTMLElement) {
    const stepIndexStr = jQuery(el).attr(STEP_INDEX_ATTR_NAME) || DEFAULT_STEP_INDEX_ATTR_VALUE;

    return Number(stepIndexStr);
  }

  private getSortOfFcElement(el: HTMLElement) {
    const sortStr = jQuery(el).attr(SORT_ATTR_NAME) || DEFAULT_SORT_ATTR_VALUE;

    return Number(sortStr);
  }

  private getPositionOfFcElement(el: HTMLElement) {
    const x = parseFloat(el.style.left);
    const y = parseFloat(el.style.top);

    return { x, y };
  }

  private getContentOfFcElement(fcNode: HTMLElement | IJQuery) {
    let $fcNode: IJQuery;

    if (fcNode instanceof HTMLElement) {
      $fcNode = jQuery(fcNode);
    } else {
      $fcNode = fcNode;
    }

    const $content = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeContent}`);

    const html = $content.html();
    const text = $content.text();

    return { html, text };
  }

  removeFcNode(node: HTMLElement | IFcNode) {
    let el: HTMLElement;

    if (node instanceof HTMLElement) {
      el = node;
    } else {
      el = this.getElementByManagedId(node.id);
    }

    this.jsPlumbInstance.deleteConnectionsForElement(el);

    el.parentNode?.removeChild(el);
  }

  getSelectedFcNode() {
    const selector = `.${FC_CSS_CLASS_NAMES.Selected}.${FC_CSS_CLASS_NAMES.Node}`;

    const $node = this.$stage.find(selector);

    return this.getElementFromJqueryObject($node);
  }

  getSelectedJsPlumbConnection() {
    const selector = `.${FC_CSS_CLASS_NAMES.Selected}.${FC_CSS_CLASS_NAMES.Connection}`;

    const connectionElement = this.$stage.find(selector).get(0);

    if (!connectionElement) {
      return null;
    }

    return this.getJsPlumbConnectionBySvgElement(connectionElement);
  }

  private getJsPlumbConnectionBySvgElement(el: HTMLElement): IJsPlumbConnection | null {
    const connections = this.jsPlumbInstance.getConnections() as IJsPlumbConnection[];

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];

      const svg: HTMLElement = (connection.connector as any).canvas;

      if (svg === el) {
        return connection;
      }
    }

    return null;
  }

  removeFcConnection(connection: IJsPlumbConnection) {
    this.jsPlumbInstance.deleteConnection(connection);
  }

  setLabelOfJsPlumbConnection(jsPlumbConnection: IJsPlumbConnection, label: string) {
    const labelOverlay = this.getLabelOverlayOfJsPlumbConnection(jsPlumbConnection);

    if (labelOverlay == null) {
      console.log('setLabelOfJsPlumbConnection(), labelOverlay is None');
      this.jsPlumbInstance.addOverlay(jsPlumbConnection, { type: LabelOverlay.type, options: { label } });
      return;
    }

    labelOverlay.setLabel(label);
  }

  emit(eventName: string, payload?: any) {
    const handlers = this.eventHandlers[eventName];

    if (!handlers) {
      return;
    }

    for (let i = 0, len = handlers.length; i < len; i += 1) {
      const handler = handlers[i];

      try {
        handler(payload);
      } catch (e) {
        console.log(e);
      }
    }
  }

  on(eventName: string, callback: (payload: any) => void) {
    const eventHandler = this.eventHandlers[eventName];

    if (!eventHandler) {
      throw new Error(`FlowChart.eventHandlers.${eventName} is None`);
    }

    eventHandler.push(callback);
  }

  off(eventName: string, callback: (payload: any) => void) {
    const handlers = this.eventHandlers[eventName];

    if (!handlers) {
      throw new Error(`FlowChart.eventHandlers.${eventName} is None`);
    }

    const targetIndex = handlers.findIndex((item) => item === callback);

    if (targetIndex === -1) {
      throw new Error(`unbind ${eventName} fail`);
    }

    handlers.splice(targetIndex, 1);
  }

  setStepIndexOfFcElement(el: HTMLElement, stepIndex: number) {
    jQuery(el).attr(STEP_INDEX_ATTR_NAME, stepIndex);
  }

  setSortOfFcElement(el: HTMLElement, sort: number) {
    jQuery(el).attr(SORT_ATTR_NAME, sort);
  }

  setBizIdOfFcElement(el: HTMLElement, bizId: string) {
    const target = this.getFcElementByBizId(bizId);

    if (target && target !== el) {
      const { text } = this.getContentOfFcElement(target);
      throw new Error(`bizId="${bizId}" is exist in node[${text}]`);
    }
    jQuery(el).attr(BIZ_ID_ATTR_NAME, bizId);
  }

  getFcElementByBizId(bizId: string) {
    const $node = this.$stage.find(`.${FC_CSS_CLASS_NAMES.Node}[data-biz-id=${bizId}]`);

    if (!this.isExistElement($node)) {
      return null;
    }

    return this.getElementFromJqueryObject($node);
  }

  setCurrentStepIndex(currentStepIndex: number | string) {
    if (this.options.highlight.type !== STEP_INDEX_HIGHLIGHT) {
      return;
    }

    this.options.highlight.value = Number(currentStepIndex);

    this.updateHighlights();
  }

  updateHighlightType(type: IFcOptions['highlight']['type']) {
    this.options.highlight.type = type;

    if (type === STEP_INDEX_HIGHLIGHT) {
      this.options.highlight.value = STEP_INDEX_HIGHLIGHT_DEFAULT_VALUE;
    } else if (type === BIZ_IDS_HIGHLIGHT) {
      this.options.highlight.value = BIZ_IDS_HIGHLIGHT_DEFAULT_VALUE();
    }

    this.updateHighlights();
  }

  setVisibleOfEndpoints(visible: boolean) {
    this.options.node.endpoint.show = visible;

    this.updateVisibleOfEndpoints();
  }

  destroy() {
    this.jsPlumbInstance.destroy();

    this.getAllFcNodes().forEach((element) => {
      element.parentNode?.removeChild(element);
    });

    const events = `.${EVENT_NAMESPACE}`;
    const stageParentElement = this.el.parentElement as HTMLElement;

    this.$stage.off(events);
    jQuery(stageParentElement).off(events);

    interact(stageParentElement).unset();

    // @ts-ignore
    this.eventHandlers = null;

    // @ts-ignore
    this.el = null;
    // @ts-ignore
    this.$stage = null;
    // @ts-ignore
    this.jsPlumbInstance = null;
  }
}
