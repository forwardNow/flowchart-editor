import Vue from 'vue';
import { IFcOptions } from '../src/commons/configs/types';

/** 流程图组件 */
export declare class FlowChart extends Vue {
  options: IFcOptions;

  toolbox: boolean;

  controls: boolean;

  controlsPosition: 'top-left' | 'top-right';
}
