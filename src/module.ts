///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import {PanelCtrl} from 'app/plugins/sdk';
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import moment from 'moment';
import $ from 'jquery';

export class TextQueryPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';

  remarkable: any;
  content: string;

  queryContent = new Array<any>();
  // Set and populate defaults
  panelDefaults = {
    mode    : "markdown", // 'html', 'markdown', 'text'
    content : "# title",
  };

  /** @ngInject **/
  constructor($scope, $injector, templateSrv, private $sce) {
    super($scope, $injector);
    this.templateSrv = templateSrv;
    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
  }

  onDataError(err) {
    console.log("onDataError", err);
  }

  onDataReceived(dataList) {
    const data: any = {};
    this.panel.queryContent = new Array<any>();
    if(dataList.length > 0 && dataList[0].type === 'table'){
      throw new Error('Data type "Table" is not supported with this panel!');
    }

    if(dataList.length > 0 && dataList[0].datapoints.length > 0){
      for(var i = 0; i < dataList.length; i=i+1){
        var dataPoint = dataList[i].datapoints[0];
        this.panel.queryContent.push(dataPoint[0]);
      }
    }
    this.render();
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/text-query-panel/partials/editor.html');
    this.editorTabIndex = 1;

    if (this.panel.mode === 'text') {
      this.panel.mode = 'markdown';
    }
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    var contentToShow = this.panel.content;

    if(this.panel.queryContent != null && this.panel.queryContent.length > 0){
      for (let i = 0; i < this.panel.queryContent.length; i=i+1){
        var tmp = new RegExp("\\$__value_" + i, "g");

        contentToShow = contentToShow.replace(tmp, this.panel.queryContent[i]); 
      }
    }
    
    if (this.panel.mode === 'markdown') {
      this.renderMarkdown(contentToShow);
    } else if (this.panel.mode === 'html') {
      this.updateContent(contentToShow);
    }
    this.renderingCompleted();
  }

  renderText(content) {
    content = content
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br/>');
    this.updateContent(content);
  }

  renderMarkdown(content) {
    if (!this.remarkable) {
      return System.import('remarkable').then(Remarkable => {
        this.remarkable = new Remarkable();
        this.$scope.$apply(() => {
          this.updateContent(this.remarkable.render(content));
        });
      });
    }

    this.updateContent(this.remarkable.render(content));
  }

  updateContent(html) {
    try {
      this.content = this.$sce.trustAsHtml(this.templateSrv.replace(html, this.panel.scopedVars));
    } catch (e) {
      console.log('Text panel error: ', e);
      this.content = this.$sce.trustAsHtml(html);
    }
  }
}

export {TextQueryPanelCtrl as PanelCtrl};
