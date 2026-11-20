// ==UserScript==
// @name Easit+
// @namespace https://github.com/theorod99/easit-plus-release
// @description Lokala förbättringar för Easit GO
// @version 2.1.1
// @match https://sjalvservice-it.norrkoping.se/*
// @run-at document-start
// @inject-into page
// @updateURL https://raw.githubusercontent.com/theorod99/easit-plus-release/main/easit-plus.meta.js
// @downloadURL https://raw.githubusercontent.com/theorod99/easit-plus-release/main/easit-plus.user.js
// @grant GM_info
// @grant GM_getValue
// @grant GM.setValues
// @grant GM_removeValueChangeListener
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_openInTab
// @grant unsafeWindow
// ==/UserScript==

(() => {
'use strict';

const VERSION = GM_info.script.version;

const RELEASES = [
  {version:'2.1.0', date:'2026-11-20', changes:[
    'Du kan återställa text som Easit tömmer i fältet Åtgärder.',
    'Klockan i uppdateringsnotisen öppnar ändringsloggen.'
  ]},
  {version:'2.0.0', date:'2026-11-19', changes:['Easit+ finns nu för Violentmonkey.']}
];

// Styles and panel markup

const UI_CSS = `/* Shared appearance for Easit+ UI. These variables never style Easit's controls. */
:root {
  --easit-plus-ui-font:system-ui,sans-serif;
  --easit-plus-ui-text:var(--easit-plus-text-253444,#253444);
  --easit-plus-ui-muted:var(--easit-plus-text-64748b,#64748b);
  --easit-plus-ui-surface:var(--easit-plus-surface-ffffff,#fff);
  --easit-plus-ui-canvas:var(--easit-plus-surface-f4f7fb,#f4f7fb);
  --easit-plus-ui-soft:var(--easit-plus-surface-f8fafc,#f8fafc);
  --easit-plus-ui-hover:var(--easit-plus-surface-f1f5f9,#f1f5f9);
  --easit-plus-ui-selected:var(--easit-plus-surface-e8f0fe,#e8f0fe);
  --easit-plus-ui-border:var(--easit-plus-border-e2e8f0,#e2e8f0);
  --easit-plus-ui-control-border:var(--easit-plus-border-cbd5e1,#cbd5e1);
  --easit-plus-ui-accent:var(--easit-plus-primary,#2d8ab3);
  --easit-plus-ui-accent-text:var(--easit-plus-text-175a9b,#175a9b);
  --easit-plus-ui-radius:6px;
  --easit-plus-ui-control-radius:4px;
  --easit-plus-ui-shadow:0 12px 32px #0f172a18,0 2px 6px #0f172a0a;
  --easit-plus-ui-backdrop:#0005;
  --easit-plus-ui-action:#2d8ab3;
  --easit-plus-ui-on-action:#000;
  --easit-plus-ui-danger:#b42318;
  --easit-plus-ui-fast:140ms;
  --easit-plus-ui-enter:180ms;
  --easit-plus-ui-ease:cubic-bezier(.2,.8,.2,1);
}
@keyframes easit-plus-panel-enter {from {opacity:0;transform:translateY(4px);} to {opacity:1;transform:translateY(0);}}
@keyframes easit-plus-fade-enter {from {opacity:0;} to {opacity:1;}}
@media (prefers-reduced-motion:reduce) {
  :root {--easit-plus-ui-fast:0ms;--easit-plus-ui-enter:0ms;}
}
`;

const STYLES_CSS = `[data-easit-plus-menu-closed] { display: none !important; }
.easit-plus-collapsed { display: none !important; }
.easit-plus-unread {
  display: inline-block; margin-left: 8px; padding: 2px 5px;
  border-radius: 3px; font: 600 11px system-ui, sans-serif;
  color: var(--easit-plus-text-154b63,#154b63); background: var(--easit-plus-surface-e0f7ff,#e0f7ff); white-space: nowrap;
}
.easit-plus-group > td {padding: 0 !important; background: var(--easit-plus-surface-eaf0f6,#eaf0f6); border-bottom: 1px solid var(--easit-plus-ui-control-border);}
.easit-plus-group button {
  display: block; box-sizing: border-box; width: 100%; border: 0;
  background: transparent; text-align: left; color: var(--easit-plus-ui-text);
  font: 600 13px system-ui, sans-serif; padding: 9px 12px; cursor: pointer;
}
.easit-plus-group button:hover {background: var(--easit-plus-ui-hover);}
.easit-plus-group button:focus-visible {
  outline: 2px solid var(--easit-plus-ui-accent); outline-offset: -2px;
}

.easit-plus-toolbar {box-sizing:border-box; width:100%; max-width:100%; min-width:0; flex:0 0 auto; align-self:stretch; grid-column:1/-1; container: easit-plus-table / inline-size; font:12px/1.5 var(--easit-plus-ui-font); color:var(--easit-plus-ui-text);}
.easit-plus-toolbar-controls {box-sizing:border-box; display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:8px 12px; min-width:0; max-width:100%;}
.easit-plus-toolbar-controls > button {min-width:0; max-width:100%;}
.easit-plus-toolbar-controls > [role="status"] {min-width:0; max-width:100%; overflow-wrap:anywhere;}
.easit-plus-toolbar-controls > [role="status"]:empty {display:none;}
.easit-plus-status-select {display:none; box-sizing:border-box; min-width:0; max-width:100%; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); padding:6px 8px; background:var(--easit-plus-ui-soft); color:inherit; font:inherit;}
.easit-plus-status-select:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:1px;}
.easit-plus-toolbar .easit-plus-handler-clear {min-width:0; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}



.easit-plus-toolbar button {border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); padding:6px 9px; background:var(--easit-plus-ui-soft); color:var(--easit-plus-ui-text); font:inherit; cursor:pointer;}
.easit-plus-toolbar button:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
.easit-plus-toolbar button:hover {background:var(--easit-plus-ui-hover);}

.easit-plus-editor {box-sizing:border-box; max-height:calc(100vh - 32px); overflow:auto; box-shadow:var(--easit-plus-ui-shadow); width:min(520px,85vw); padding:16px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius); color:var(--easit-plus-ui-text); background:var(--easit-plus-ui-surface); font:13px/1.5 var(--easit-plus-ui-font); z-index:2147483647;}
.easit-plus-editor::backdrop {background:var(--easit-plus-ui-backdrop);}
.easit-plus-editor h2 {font-size:16px; margin:0 0 16px;}
.easit-plus-editor label {display:block;}
.easit-plus-editor textarea {display:block; box-sizing:border-box; width:100%; margin-top:8px; padding:8px; resize:vertical; font:inherit; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-surface); color:inherit;}
.easit-plus-editor p {font-size:12px;}
.easit-plus-editor button {padding:7px 12px; margin-right:8px; cursor:pointer; background:var(--easit-plus-ui-soft); color:var(--easit-plus-ui-text); border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); font:inherit;}
.easit-plus-editor button:hover:not(:disabled) {background:var(--easit-plus-ui-hover);}
.easit-plus-editor button:disabled {opacity:.45; cursor:default;}
.easit-plus-editor :focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}

.easit-plus-menu-icon {display:inline-block; vertical-align:middle; margin-right:7px; flex-shrink:0;}

[data-easit-plus-indicator-column] {width:124px !important; min-width:124px !important; box-sizing:border-box;}
[data-easit-plus-indicator-column] > .z-listcell-content {white-space:nowrap !important;}
.easit-plus-indicators {display:inline-flex; align-items:center; gap:0; margin-left:16px; padding:1px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-soft); vertical-align:middle; white-space:nowrap;}
.easit-plus-indicators > button {display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; width:28px; height:26px; padding:0; margin:0; border:0; border-radius:var(--easit-plus-ui-control-radius); box-shadow:none; background:transparent; font:16px system-ui,sans-serif; line-height:1; color:var(--easit-plus-ui-accent-text); cursor:pointer;}
.easit-plus-indicators > button:hover {background:var(--easit-plus-ui-selected);}
.easit-plus-indicators > button:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:1px;}
.easit-plus-note-preview {position:fixed; z-index:2147483646; box-sizing:border-box; width:max-content; max-width:min(360px,calc(100vw - 16px)); max-height:min(320px,calc(100vh - 16px)); overflow:auto; padding:12px 14px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-surface); color:var(--easit-plus-ui-text); box-shadow:var(--easit-plus-ui-shadow); font:13px/1.5 var(--easit-plus-ui-font); pointer-events:none;}
.easit-plus-note-preview > div {white-space:pre-wrap; overflow-wrap:anywhere;}
.easit-plus-note-preview small {display:block; margin-top:8px; color:var(--easit-plus-ui-muted); font-size:11px;}
.easit-plus-emoji-choices {display:flex; flex-wrap:wrap; gap:4px; margin:0 0 16px;}
.easit-plus-emoji-choices button {margin:0; width:36px; height:34px; padding:0; background:var(--easit-plus-ui-soft); border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-control-radius); font-size:19px;}
.easit-plus-emoji-choices button[aria-pressed="true"] {border-color:var(--easit-plus-ui-accent); background:var(--easit-plus-ui-selected);}

.easit-plus-filtered {display:none !important;}
.easit-plus-toolbar {display:block;}
.easit-plus-toolbar .easit-plus-group-switch {display:inline-flex; align-items:center; gap:8px; flex-shrink:0; border:0; padding:4px 0; background:transparent; font:inherit; color:inherit;}
.easit-plus-toolbar .easit-plus-group-switch:hover {background:transparent;}
.easit-plus-switch-track {position:relative; display:inline-block; width:32px; height:19px; border-radius:12px; background:var(--easit-plus-surface-cbd5e1,#cbd5e1); transition:background .15s;}
.easit-plus-switch-track::after {content:""; position:absolute; width:13px; height:13px; top:3px; left:3px; border-radius:50%; background:white; transition:transform .15s;}
.easit-plus-group-switch[aria-checked="true"] .easit-plus-switch-track {background:var(--easit-plus-ui-accent);}
.easit-plus-group-switch[aria-checked="true"] .easit-plus-switch-track::after {transform:translateX(13px);}
.easit-plus-status-tabs {display:flex; flex-wrap:wrap; gap:4px; min-width:0; max-width:100%;}
.easit-plus-toolbar .easit-plus-status-tab {padding:6px 10px; border:1px solid transparent; border-radius:var(--easit-plus-ui-control-radius); background:transparent; color:inherit; font:inherit;}
.easit-plus-toolbar .easit-plus-status-tab:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-toolbar .easit-plus-status-tab[aria-selected="true"] {background:var(--easit-plus-ui-selected); border-color:var(--easit-plus-ui-control-border); color:var(--easit-plus-ui-accent-text); font-weight:600;}

.easit-plus-loading-toast {position:fixed; right:31.25px; bottom:31.25px; z-index:2147483647; display:grid; grid-template-columns:25px minmax(0,1fr) 25px 20.3125px; grid-template-rows:1fr; align-items:center; gap:7.8125px; pointer-events:auto;}
.easit-plus-loading-title {position:absolute; width:1.5625px; height:1.5625px; margin:-1.5625px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0;}
.easit-plus-loading-detail {grid-column:2; grid-row:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2; font-size:17.1875px; font-weight:600; letter-spacing:-0.3125px; font-variant-numeric:tabular-nums;}
.easit-plus-loading-symbol {grid-column:1; grid-row:1; position:relative; box-sizing:border-box; width:25px; height:25px; border-radius:50%; background:var(--easit-plus-ui-soft); color:var(--easit-plus-primary,#2d8ab3);}
.easit-plus-loading-symbol::before {content:""; position:absolute; inset:4.6875px; box-sizing:border-box; border:1.5625px solid currentColor; border-right-color:transparent; border-radius:50%; animation:easit-plus-loading-spin .8s linear infinite;}
.easit-plus-loading-toast[data-loading="false"] .easit-plus-loading-symbol {color:#1b7a56; background:#edf7f1;}
.easit-plus-loading-toast[data-loading="false"] .easit-plus-loading-symbol::before {inset:auto; left:50%; top:50%; width:5.46875px; height:9.375px; border:solid currentColor; border-width:0 1.5625px 1.5625px 0; border-radius:0; transform:translate(-50%,-60%) rotate(45deg); animation:none;}
.easit-plus-loading-copy {grid-column:3; grid-row:1; appearance:none; position:relative; box-sizing:border-box; width:25px; height:25px; min-width:0; min-height:0; margin:0; padding:0; border:0; border-radius:4.6875px; background:transparent; color:var(--easit-plus-ui-muted); cursor:pointer;}
.easit-plus-loading-copy::before,.easit-plus-loading-copy::after {content:""; position:absolute; box-sizing:border-box; width:8.59375px; height:10.15625px; left:50%; top:50%; border:1.171875px solid currentColor; border-radius:1.5625px; transform:translate(-65%,-65%);}
.easit-plus-loading-copy::after {transform:translate(-35%,-35%); background:var(--easit-plus-ui-surface);}
.easit-plus-loading-copy:hover:not(:disabled) {background:var(--easit-plus-ui-hover);}
.easit-plus-loading-copy:focus-visible {outline:1.5625px solid var(--easit-plus-primary,#2d8ab3); outline-offset:0.78125px;}
.easit-plus-loading-copy:disabled {opacity:.35; cursor:default;}
.easit-plus-loading-copy[data-state="copied"] {color:#1b7a56;}
.easit-plus-loading-copy[data-state="copied"]::before {display:none;}
.easit-plus-loading-copy[data-state="copied"]::after {width:5.46875px; height:9.375px; border-width:0 1.5625px 1.5625px 0; border-radius:0; background:transparent; transform:translate(-50%,-60%) rotate(45deg);}
.easit-plus-loading-copy[data-state="error"] {color:#b42318;}
@keyframes easit-plus-loading-spin {to {transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce) {.easit-plus-loading-symbol::before {animation:none;}}
.easit-plus-toolbar button[hidden] {display:none;}
.easit-plus-handlers {box-sizing:border-box; width:532px; max-width:calc(100vw - 32px); max-height:min(70vh,520px); overflow:auto; margin:auto; padding:16px; box-shadow:var(--easit-plus-ui-shadow); border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-surface); color:var(--easit-plus-ui-text); font:13px/1.5 var(--easit-plus-ui-font);}
.easit-plus-handlers::backdrop {background:var(--easit-plus-ui-backdrop);}
.easit-plus-handlers-header {display:flex; align-items:center; justify-content:space-between; gap:10px;}
.easit-plus-handlers-actions {display:flex; align-items:center; gap:4px;}
.easit-plus-handler-settings {display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; box-sizing:border-box; width:28px; height:28px; padding:0; border:0; border-radius:var(--easit-plus-ui-control-radius); background:transparent; color:inherit; font:20px/1 var(--easit-plus-ui-font); cursor:pointer;}
.easit-plus-handler-settings:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-handler-settings:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
.easit-plus-toolbar .easit-plus-handler-settings {padding:0; border:0; background:transparent; font-size:20px; line-height:1;}
.easit-plus-queue-exclude-form {display:flex; align-items:flex-end; gap:8px; margin:16px 0;}
.easit-plus-queue-exclude-form label {display:flex; flex:1; flex-direction:column; gap:5px; min-width:0;}
.easit-plus-queue-exclude-form input {box-sizing:border-box; width:100%; min-width:0; padding:8px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-surface); color:inherit; font:inherit;}
.easit-plus-queue-settings button:not(.easit-plus-handlers-close) {padding:8px 10px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-soft); color:inherit; font:inherit; cursor:pointer;}
.easit-plus-queue-exclusions {margin:0; padding:0; list-style:none;}
.easit-plus-queue-exclusions li {display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-top:1px solid var(--easit-plus-ui-border);}
.easit-plus-queue-exclusions span {min-width:0; overflow-wrap:anywhere;}
select[data-easit-plus-assignee-native] {position:absolute!important; width:1px!important; height:1px!important; margin:-1px!important; padding:0!important; border:0!important; overflow:hidden!important; clip-path:inset(50%)!important; opacity:0!important; pointer-events:none!important;}
.easit-plus-assignee-control {display:flex; align-items:center; box-sizing:border-box; appearance:none; width:100%; min-width:0; min-height:32px; padding:calc(6px + var(--ui-density,0px)) 30px calc(6px + var(--ui-density,0px)) calc(6px + var(--ui-density,0px)); border:2px solid #e2edf7; border-radius:6px; background:#f8fbfe; color:#000; font:normal 12px/normal Roboto,"Segoe UI",AvenirNext-UltraLight,Avenir-Light,Verdana,Tahoma,Arial,Helvetica,sans-serif; text-align:left; cursor:pointer;}
.easit-plus-assignee-control > .easit-plus-assignee-name {flex:1; min-width:0; min-height:1em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.easit-plus-assignee-name,.easit-plus-assignee-count {font:inherit!important; letter-spacing:inherit;}
.easit-plus-assignee-recommendation {color:var(--easit-plus-primary,#2d8ab3); vertical-align:-2px;}
.easit-plus-assignee-control:disabled {opacity:.55; cursor:default;}
.easit-plus-assignee-control:focus-visible {outline:1px solid Highlight; outline-offset:0;}
/* Match the supplied native select menu: flat surface, square gray border,
   compact full-width rows and the browser's native selected-item colors. */
.easit-plus-assignee-popup {position:fixed; inset:auto; box-sizing:border-box; max-width:calc(100vw - 24px); margin:0; padding:0; overflow:auto; z-index:2147483647; border:1px solid #767676; border-radius:0; background:var(--easit-plus-native-select-background,#f9fcfe); color:var(--easit-plus-native-select-text,#000); box-shadow:none; font:normal 12px/normal Roboto,"Segoe UI",AvenirNext-UltraLight,Avenir-Light,Verdana,Tahoma,Arial,Helvetica,sans-serif;}
.easit-plus-assignee-popup[hidden],.easit-plus-assignee-popup [hidden] {display:none!important;}
.easit-plus-assignee-option,.easit-plus-assignee-excluded-toggle {box-sizing:border-box; min-height:24px; padding:4px 6px; color:inherit; font:inherit!important; line-height:16px!important; letter-spacing:inherit; text-align:left; cursor:default;}
.easit-plus-assignee-option {display:flex; align-items:center; gap:6px;}
.easit-plus-assignee-option > .easit-plus-assignee-name {flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.easit-plus-assignee-option > .easit-plus-assignee-recommendation {flex:none;}
.easit-plus-assignee-option > .easit-plus-assignee-count {flex:none; white-space:nowrap;}
.easit-plus-assignee-option:not([aria-disabled="true"]):hover,.easit-plus-assignee-excluded-toggle:hover,
.easit-plus-assignee-popup:not(:has(.easit-plus-assignee-option:not([aria-disabled="true"]):hover,.easit-plus-assignee-excluded-toggle:hover)) :is(.easit-plus-assignee-option:not([aria-disabled="true"]),.easit-plus-assignee-excluded-toggle):focus {background-color:SelectedItem; color:SelectedItemText;}
.easit-plus-assignee-option:focus-visible,.easit-plus-assignee-excluded-toggle:focus-visible {outline:1px dotted currentColor; outline-offset:-1px;}
.easit-plus-assignee-option[aria-disabled="true"] {color:GrayText;}
.easit-plus-assignee-excluded .easit-plus-assignee-name,.easit-plus-assignee-excluded .easit-plus-assignee-count {color:GrayText;}
.easit-plus-assignee-menu {position:fixed; inset:auto; box-sizing:border-box; min-width:160px; max-width:calc(100vw - 16px); margin:0; padding:2px; z-index:2147483647; border:1px solid GrayText; border-radius:0; background:Canvas; color:CanvasText; box-shadow:none; font:normal 12px/normal Roboto,"Segoe UI",AvenirNext-UltraLight,Avenir-Light,Verdana,Tahoma,Arial,Helvetica,sans-serif;}
.easit-plus-assignee-menu button {display:block; width:100%; padding:5px 10px; border:0; border-radius:0; background:transparent; color:inherit; font:inherit!important; text-align:left; cursor:default;}
.easit-plus-assignee-menu [hidden] {display:none!important;}
.easit-plus-assignee-menu button:hover,.easit-plus-assignee-menu button:focus-visible {outline:none; background-color:SelectedItem; color:SelectedItemText;}
.easit-plus-assignee-menu button:disabled {color:GrayText;}
.easit-plus-assignee-menu [role="alert"] {max-width:240px; padding:4px 10px; font:inherit;}
.easit-plus-handlers h2 {margin:0; font-size:16px;}
.easit-plus-handlers-close {position:relative; flex-shrink:0; width:28px; height:28px; padding:0; border:0; border-radius:var(--easit-plus-ui-control-radius); background:transparent; color:inherit; cursor:pointer;}
.easit-plus-handlers-close::before,.easit-plus-handlers-close::after {content:""; position:absolute; left:50%; top:50%; width:12px; height:1.5px; border-radius:1px; background:currentColor; transform:translate(-50%,-50%) rotate(45deg); pointer-events:none;}
.easit-plus-handlers-close::after {transform:translate(-50%,-50%) rotate(-45deg);}
.easit-plus-handlers-close:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-handlers-close:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
.easit-plus-handlers p {margin:8px 0 12px; color:var(--easit-plus-ui-muted); font-size:11px; line-height:1.5;}
.easit-plus-handler-cards {display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin:0; padding:0; list-style:none;}
.easit-plus-handler-cards > li {min-width:0;}
.easit-plus-handlers .easit-plus-handler-card {display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:5px; box-sizing:border-box; width:100%; height:100%; min-height:76px; padding:10px 7px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-soft); color:inherit; font:11px system-ui,sans-serif; text-align:center; cursor:pointer;}
.easit-plus-handlers .easit-plus-handler-card:hover {border-color:var(--easit-plus-ui-accent); background:var(--easit-plus-ui-hover);}
.easit-plus-handlers .easit-plus-handler-card[aria-pressed="true"] {border-color:var(--easit-plus-ui-accent); background:var(--easit-plus-ui-selected);}
.easit-plus-handlers .easit-plus-handler-card:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
.easit-plus-handler-numbers {display:block; font-variant-numeric:tabular-nums; line-height:1.1; white-space:nowrap;}
.easit-plus-handler-total {font-size:24px; font-weight:700; color:var(--easit-plus-ui-accent-text);}
.easit-plus-handler-waiting {font-size:16px; font-weight:500; color:var(--easit-plus-ui-muted);}
.easit-plus-handler-name {display:block; max-width:100%; overflow-wrap:anywhere; line-height:1.4;}

@media (max-width:480px) {.easit-plus-handler-cards {grid-template-columns:repeat(3,minmax(0,1fr));}}
@media (max-width:340px) {.easit-plus-handler-cards {grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:240px) {.easit-plus-handler-cards {grid-template-columns:minmax(0,1fr);}}


.easit-plus-loading-close {grid-column:4; grid-row:1; position:relative; appearance:none; box-sizing:border-box; display:block; width:20.3125px; height:20.3125px; min-width:0; min-height:0; margin:0; padding:0; border:0; border-radius:3.125px; background:transparent; color:inherit; line-height:1; cursor:pointer;}
.easit-plus-loading-close::before,.easit-plus-loading-close::after {content:""; position:absolute; left:50%; top:50%; width:9.375px; height:1.5625px; border-radius:0.78125px; background:currentColor; transform:translate(-50%,-50%) rotate(45deg); pointer-events:none;}
.easit-plus-loading-close::after {transform:translate(-50%,-50%) rotate(-45deg);}
.easit-plus-loading-close:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-loading-close:focus-visible {outline:1.5625px solid var(--easit-plus-primary,#2d8ab3); outline-offset:0.78125px;}
.search-container.easit-plus-search-container {display:flex; align-items:center; justify-content:center; gap:8px;}



@container easit-plus-table (max-width:719px) {
  .easit-plus-toolbar-controls {gap:8px; padding:8px;}
  .easit-plus-status-tabs {display:none;}
  .easit-plus-status-select {display:block; flex:1 1 160px; width:0;}
}
@container easit-plus-table (max-width:359px) {
  .easit-plus-toolbar-controls {gap:6px; padding:6px;}
  .easit-plus-group-label {display:none;}
  .easit-plus-status-select {flex-basis:120px;}
}

/* Only Easit+ controls receive transitions; table rows and native fields stay stable. */
:is(.easit-plus-toolbar,.easit-plus-editor,.easit-plus-handlers,.easit-plus-indicators) button,
.easit-plus-loading-close {
 transition:background-color var(--easit-plus-ui-fast) ease,border-color var(--easit-plus-ui-fast) ease,box-shadow var(--easit-plus-ui-fast) ease;
}
.easit-plus-editor[open],.easit-plus-handlers[open],.easit-plus-note-preview {
 animation:easit-plus-panel-enter var(--easit-plus-ui-enter) var(--easit-plus-ui-ease);
}
.easit-plus-assignee-popup:popover-open,.easit-plus-assignee-menu:popover-open {
 animation:easit-plus-fade-enter var(--easit-plus-ui-enter) ease;
}
.easit-plus-editor[open]::backdrop,.easit-plus-handlers[open]::backdrop {animation:easit-plus-fade-enter var(--easit-plus-ui-enter) ease;}
.easit-plus-handlers .easit-plus-handler-card {gap:7px;}
.easit-plus-assignee-count {font-variant-numeric:tabular-nums;}
.easit-plus-mail-action {padding-right:5px;}
[testid="component-Åtgärder"] :has(> .easit-plus-actions-undo) {position:relative;}
.easit-plus-actions-undo {
  position:absolute; right:8px; bottom:9px; z-index:1; display:grid; place-items:center;
  box-sizing:border-box; width:28px; height:28px; padding:0; cursor:pointer;
  border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius);
  background:var(--easit-plus-ui-surface); color:var(--easit-plus-ui-accent-text);
}
.easit-plus-actions-undo:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-actions-undo:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:1px;}
@media (forced-colors:active) {
 .easit-plus-status-tabs button[aria-selected=true],.easit-plus-emoji-choices button[aria-pressed=true] {outline:1px solid Highlight;}
}
`;

const FEEDBACK_CSS = `.easit-plus-notice-stack {
  position:fixed; right:20px; bottom:20px; z-index:2147483647;
  display:flex; flex-direction:column; align-items:flex-end; gap:10px;
  width:max-content; max-width:calc(100vw - 32px); pointer-events:none;
}
.easit-plus-notice-stack > .easit-plus-loading-toast {position:relative; right:auto; bottom:auto; max-width:100%;}
.easit-plus-copy-toast,.easit-plus-loading-toast,.easit-plus-release-notice {
  position:relative; box-sizing:border-box; overflow:hidden; width:218.75px; height:53.125px; max-width:100%; padding:9.375px 10.9375px;
  border:0.78125px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius);
  background:var(--easit-plus-ui-surface); color:var(--easit-plus-ui-text);
  box-shadow:var(--easit-plus-ui-shadow); font:10.15625px system-ui,sans-serif;
}
.easit-plus-copy-toast,.easit-plus-release-notice {font-size:17.1875px; font-weight:600; line-height:1.2; letter-spacing:-0.3125px;}
.easit-plus-copy-toast {display:grid; grid-template-columns:25px minmax(0,1fr); align-items:center; gap:7.8125px; pointer-events:none; animation:easit-plus-copy-appear .14s ease-out;}
.easit-plus-notice-check {position:relative; display:block; flex:none; width:25px; height:25px; border-radius:50%; background:#edf7f1; color:#1b7a56;}
.easit-plus-notice-check::before {content:""; position:absolute; box-sizing:border-box; left:50%; top:50%; width:5.46875px; height:9.375px; border:solid currentColor; border-width:0 1.5625px 1.5625px 0; transform:translate(-50%,-60%) rotate(45deg);}
@keyframes easit-plus-copy-appear {from {opacity:0; transform:translateY(2.34375px);} to {opacity:1; transform:translateY(0);}}
@media (prefers-reduced-motion:reduce) {.easit-plus-copy-toast,.easit-plus-loading-toast,.easit-plus-release-notice {animation:none;}}

.easit-plus-timeout-track {
  position:absolute; left:0; right:0; bottom:0; height:2px;
  overflow:hidden; pointer-events:none;
  background:var(--easit-plus-ui-border);
}
.easit-plus-timeout-bar {
  position:absolute; left:0; bottom:0; display:block; width:100%; height:100%;
  background:var(--easit-plus-primary,#2d8ab3); transform:scaleX(1); transform-origin:left center; will-change:transform;
}

.easit-plus-loading-toast {animation:easit-plus-copy-appear var(--easit-plus-ui-enter,180ms) ease-out;}
.easit-plus-reminders {display:flex; flex-direction:column; gap:8px; width:280px; max-width:100%; max-height:60vh; overflow:auto; pointer-events:auto;}
.easit-plus-reminder {box-sizing:border-box; padding:11px 12px; border:1px solid var(--easit-plus-ui-border); border-radius:9px; background:var(--easit-plus-ui-surface); color:var(--easit-plus-ui-text); box-shadow:0 3px 14px #00000012; font:12px/1.45 var(--easit-plus-ui-font); overflow-wrap:anywhere;}
.easit-plus-reminder-head {display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:5px;}
.easit-plus-reminder-head strong {font-size:11px; font-weight:600; color:var(--easit-plus-ui-muted);}
.easit-plus-reminder time,.easit-plus-reminder-link {display:block;}
.easit-plus-reminder-link {color:inherit; text-decoration:none; font-weight:600; margin:0 0 4px;}
.easit-plus-reminder-link:hover {text-decoration:underline;}
.easit-plus-reminder time {font-size:10px; color:var(--easit-plus-ui-muted);}
.easit-plus-reminder-text {white-space:pre-wrap; max-height:54px; overflow:auto; margin:7px 0 0; font-size:11px;}
.easit-plus-reminder-error:empty {display:none;}
.easit-plus-reminder-dismiss {position:relative; flex-shrink:0; width:24px; height:24px; padding:0; border:0; border-radius:5px; background:transparent; color:var(--easit-plus-ui-muted); cursor:pointer;}
.easit-plus-reminder-dismiss::before,.easit-plus-reminder-dismiss::after {content:""; position:absolute; left:50%; top:50%; width:10px; height:1.5px; background:currentColor; transform:translate(-50%,-50%) rotate(45deg);}
.easit-plus-reminder-dismiss::after {transform:translate(-50%,-50%) rotate(-45deg);}
.easit-plus-reminder-dismiss:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-reminder button:focus-visible,.easit-plus-reminder a:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
@media (prefers-reduced-motion:reduce) {.easit-plus-copy-toast,.easit-plus-loading-toast,.easit-plus-release-notice {animation:none;}}

.easit-plus-release-notice {display:flex; align-items:center; gap:7.8125px; width:max-content; pointer-events:auto;}
.easit-plus-release-notice strong {min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:inherit;}
.easit-plus-release-history {
  display:grid; place-items:center; flex:none; width:25px; height:25px; padding:0; border:0;
  border-radius:var(--easit-plus-ui-control-radius); background:transparent; color:var(--easit-plus-ui-accent-text); cursor:pointer;
}
.easit-plus-release-history:hover {background:var(--easit-plus-ui-hover);}
.easit-plus-release-history:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:1px;}
.easit-plus-release-notice .easit-plus-loading-close {flex:none;}
@media (max-width:360px) {
  .easit-plus-release-notice {gap:4px; padding-inline:8px;}
}
@media (prefers-reduced-motion:no-preference) {
  .easit-plus-release-notice {animation:easit-plus-copy-appear var(--easit-plus-ui-enter,180ms) ease-out;}
}
`;

const POPUP_CSS = `:root {font-family:var(--easit-plus-ui-font); color:var(--easit-plus-ui-text); background:var(--easit-plus-ui-canvas); color-scheme:light;}
body {width:390px; margin:0; font-size:13px;}
header {padding:16px; background:var(--easit-plus-ui-surface); border-bottom:1px solid var(--easit-plus-ui-border);}
.brand {display:flex; align-items:center; gap:11px;}
.brand-icon {display:grid; place-items:center; width:38px; height:38px; border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-selected); color:var(--easit-plus-ui-accent-text); font-weight:750; font-size:18px;}
h1 {margin:0; font-size:22px; letter-spacing:-.6px;}
header p {margin:3px 0 0; font-size:11px; color:var(--easit-plus-ui-muted);}
#version {margin-left:auto; font-size:11px; color:var(--easit-plus-ui-muted); background:var(--easit-plus-ui-hover); padding:4px 6px; border-radius:var(--easit-plus-ui-control-radius); white-space:nowrap;}
main {padding:12px 14px 0;}
fieldset {border:0; margin:0; padding:0; min-width:0;}
.card {box-shadow:var(--easit-plus-ui-shadow); padding:12px; margin-bottom:10px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-surface);}
h2 {font-size:12px; margin:0 0 7px; font-weight:700; color:var(--easit-plus-ui-text);}
.toggle {display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 0; font-weight:600;}
.toggle+.toggle {border-top:1px solid var(--easit-plus-ui-border);}
small {display:block; margin-top:4px; font-size:11px; font-weight:400; color:var(--easit-plus-ui-muted); line-height:1.4;}
input[type=checkbox] {appearance:none; flex-shrink:0; width:32px; height:19px; margin:0; border-radius:20px; background:var(--easit-plus-surface-cbd5e1,#cbd5e1); cursor:pointer; position:relative;}
input[type=checkbox]::before {content:""; position:absolute; width:13px; height:13px; background:white; border-radius:50%; top:3px; left:3px; transition:transform .12s;}
input[type=checkbox]:checked {background:var(--easit-plus-ui-accent);}
input[type=checkbox]:checked::before {transform:translateX(13px);}
.hint {color:var(--easit-plus-ui-muted); line-height:1.6; font-size:12px; margin:0 0 9px;}
.counts {font-size:12px; margin:0; color:var(--easit-plus-ui-text);}
.buttons {display:flex; gap:8px;}
button {font:inherit; cursor:pointer; border:1px solid var(--easit-plus-ui-control-border); padding:7px 11px; border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-soft); color:var(--easit-plus-ui-text);}
button:hover {background:var(--easit-plus-ui-hover); border-color:var(--easit-plus-ui-accent);}
button:disabled {opacity:.6; cursor:wait;}
#export {background:var(--easit-plus-ui-action); color:var(--easit-plus-ui-on-action); border-color:var(--easit-plus-ui-action);}
details {margin-top:10px; font-size:11px; color:var(--easit-plus-ui-muted);}
summary {cursor:pointer;}
textarea {box-sizing:border-box; width:100%; margin:8px 0; padding:8px; resize:vertical; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); font:11px system-ui,sans-serif;}
textarea,input:not([type=checkbox]):not([type=color]),select {background:var(--easit-plus-ui-surface); color:inherit;}
.bottom {display:flex; align-items:center; gap:10px; padding:3px 0;}
.bottom span {font-size:10px; color:var(--easit-plus-ui-muted); line-height:1.5;}

#message {min-height:16px; font-size:12px; color:var(--easit-plus-text-245b43,#245b43); margin:8px 0; line-height:1.5;}
footer {padding:5px 14px 14px; color:var(--easit-plus-ui-muted); font-size:11px; display:flex; align-items:center; gap:6px;}
.local-dot {width:6px; height:6px; border-radius:50%; background:var(--easit-plus-surface-379668,#379668);}
:focus-visible {outline:2px solid var(--easit-plus-ui-accent); outline-offset:2px;}
.sr-only {position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%);}

.theme-picker {display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 0;}
.color-swatch[data-easit-plus-color-value] {width:48px; height:30px; padding:3px; background:var(--swatch-color); box-shadow:inset 0 0 0 3px var(--easit-plus-ui-surface);}
.color-swatch[data-easit-plus-color-value]:hover {background:var(--swatch-color);}
.color-swatch:disabled {opacity:.45; cursor:default;}
#colorDialog {max-width:320px;}
.color-heading {display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;}
.color-heading h2 {margin:0;}
#closeColor {position:relative; box-sizing:border-box; flex:0 0 28px; width:28px; height:28px; padding:0;}
#closeColor::before,#closeColor::after {content:""; position:absolute; left:50%; top:50%; width:12px; height:1.5px; border-radius:1px; background:currentColor; pointer-events:none;}
#closeColor::before {transform:translate(-50%,-50%) rotate(45deg);}
#closeColor::after {transform:translate(-50%,-50%) rotate(-45deg);}
.color-plane[data-easit-plus-color-value] {position:relative; height:140px; margin:5px; border-radius:4px; background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),var(--picker-hue); touch-action:none; cursor:crosshair;}
[data-easit-plus-color-value] #colorCursor {position:absolute; width:10px; height:10px; border:2px solid white; border-radius:50%; box-shadow:0 0 0 1px #333; transform:translate(-50%,-50%); pointer-events:none;}
#colorHue[data-easit-plus-color-value] {display:block; width:100%; height:16px; margin:14px 0; appearance:none; border-radius:6px; background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);}
.color-hue[data-easit-plus-color-value]::-webkit-slider-thumb {appearance:none; width:12px; height:20px; border:2px solid white; border-radius:4px; background:transparent; box-shadow:0 0 0 1px #333; cursor:ew-resize;}
.color-sliders {display:grid; grid-template-columns:auto minmax(0,1fr); gap:6px 10px; align-items:center; font-size:11px; margin:12px 0;}
.color-sliders input {min-width:0; width:100%; margin:0; accent-color:var(--easit-plus-ui-accent);}
.color-code-row {display:flex; align-items:center; gap:7px;}
#colorPreview {flex:0 0 26px; height:30px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius);}
.color-code-row input,.color-code-row select {box-sizing:border-box; min-width:0; height:34px; padding:6px 8px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); font:inherit;}
#colorCode {flex:1; width:0;}
#colorFormat {flex:0 0 70px;}
#colorCode[aria-invalid=true] {border-color:var(--easit-plus-ui-danger);}
#colorError {min-height:14px; margin:8px 0 0; font-size:11px; color:var(--easit-plus-ui-danger);}
.color-dialog .color-sliders label {margin:0; font-weight:400;}

html {width:390px; height:600px; max-height:600px; border-radius:var(--easit-plus-ui-radius); overflow:hidden;}
body {box-sizing:border-box; width:100%; height:100%; border-radius:var(--easit-plus-ui-radius); overflow-x:hidden; overflow-y:scroll;
  scrollbar-width:thin; scrollbar-color:var(--easit-plus-ui-control-border) var(--easit-plus-ui-canvas);}
body::-webkit-scrollbar {width:8px;}
body::-webkit-scrollbar-track {background:var(--easit-plus-ui-canvas);}
body::-webkit-scrollbar-thumb {border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-control-border);}
#message:empty {display:none;}
.loading-duration {display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 0;}
.loading-duration input {box-sizing:border-box; width:62px; padding:5px 6px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); font:inherit;}

.snippet-title {display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:9px;}
.snippet-title h2 {margin:0;}
#snippetCount {font-weight:400; color:var(--easit-plus-ui-muted);}
.snippet-list {list-style:none; padding:0; margin:0; max-height:260px; overflow-y:auto;}
.snippet-row {padding:10px 0; border-top:1px solid var(--easit-plus-ui-border);}
.snippet-heading {display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:5px 10px;}
.snippet-heading strong {overflow-wrap:anywhere; min-width:0;}
.snippet-heading code {overflow-wrap:anywhere; padding:2px 5px; background:var(--easit-plus-ui-hover); border-radius:var(--easit-plus-ui-control-radius); font-size:11px;}
.snippet-preview {white-space:pre-wrap; overflow-wrap:anywhere; color:var(--easit-plus-ui-muted); font-size:11px; margin:7px 0; max-height:46px; overflow:hidden;}
.snippet-row button {font-size:11px; padding:5px 8px;}
#snippetForm {margin:0; padding:0;}
#snippetForm h3 {font-size:12px; margin:0 0 10px;}
#snippetForm label {display:block; margin-top:9px; font-size:12px; font-weight:600;}
#snippetForm input {box-sizing:border-box; width:100%; font:inherit; padding:8px; margin-top:5px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius);}
#snippetText {font:12px system-ui,sans-serif; line-height:1.5; margin:5px 0 9px;}
#saveSnippet {background:var(--easit-plus-ui-action); color:var(--easit-plus-ui-on-action); border-color:var(--easit-plus-ui-action);}
.snippet-message {font-size:12px; line-height:1.5; margin:8px 0 0; overflow-wrap:anywhere;}
.snippet-message:empty {display:none;}

.popup-top {position:sticky; top:0; z-index:2; background:var(--easit-plus-ui-surface);}
.popup-tabs {display:flex; gap:4px; padding:8px 14px; border-bottom:1px solid var(--easit-plus-ui-border);}
.popup-tabs button {flex:1; padding:8px 10px; border:1px solid transparent; border-radius:var(--easit-plus-ui-control-radius); background:transparent; font-size:12px; font-weight:600; color:var(--easit-plus-ui-muted);}
.popup-tabs button[aria-selected="true"] {background:var(--easit-plus-ui-selected); color:var(--easit-plus-ui-accent-text);}
.popup-tabs button:hover {background:var(--easit-plus-ui-hover);}
#snippetsPanel[hidden], #settingsPanel[hidden] {display:none !important;}
.picker-setting {display:flex;align-items:center;justify-content:space-between;gap:12px;}
.picker-setting input {width:90px;padding:6px;border:1px solid var(--easit-plus-ui-control-border);border-radius:var(--easit-plus-ui-control-radius);background:var(--easit-plus-ui-soft);color:inherit;font:inherit;}
.history-stats {display:flex;gap:12px;margin:12px 0;}
.history-stats span {flex:1;padding:8px;border:1px solid var(--easit-plus-ui-control-border);border-radius:var(--easit-plus-ui-control-radius);background:var(--easit-plus-ui-soft);font-size:11px;}
.history-stats strong {display:block;margin-top:3px;font-size:18px;color:var(--easit-plus-ui-text);}
.history-scroll {max-height:210px;overflow:auto;margin:8px 0;}
.history-table {width:100%;border-collapse:collapse;font-size:10px;color:var(--easit-plus-ui-text);}
.history-table th,.history-table td {text-align:left;padding:6px 4px;border-bottom:1px solid var(--easit-plus-ui-border);}
.history-table th {position:sticky;top:0;background:var(--easit-plus-ui-surface);}
.history-table td:nth-child(2) {white-space:nowrap;}

#ticketsPanel[hidden] {display:none !important;}
.ticket-list {list-style:none; margin:0; padding:0;}
.ticket-row {padding:11px 0; border-top:1px solid var(--easit-plus-ui-border);}
.ticket-heading {display:flex; align-items:flex-start; gap:8px;}
.ticket-open {display:block; flex:1; min-width:0; color:inherit; text-decoration:none; border-radius:var(--easit-plus-ui-control-radius); overflow-wrap:anywhere;}
.ticket-open:hover .ticket-title {text-decoration:underline;}
.ticket-open strong {color:var(--easit-plus-ui-accent-text);}
.ticket-icons {display:inline-flex; gap:5px; margin-left:7px;}
.ticket-title {display:block; margin:5px 0; line-height:1.5; font-weight:600;}
.ticket-status {display:block; font-size:11px; color:var(--easit-plus-ui-muted);}
.ticket-more {flex-shrink:0; padding:0 8px; font-size:22px; line-height:1.1;}
.ticket-note {white-space:pre-wrap; overflow-wrap:anywhere; max-height:150px; overflow-y:auto; margin:9px 0 0; padding:9px; border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-canvas); font-size:12px; line-height:1.5;}
#ticketsMessage:empty {display:none;}
.ticket-menu {position:fixed; z-index:10; box-sizing:border-box; width:220px; max-width:calc(100vw - 12px); padding:5px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-surface); box-shadow:var(--easit-plus-ui-shadow);}
.ticket-menu[hidden] {display:none;}
.ticket-menu button {display:block; width:100%; text-align:left; border:0; background:transparent; padding:8px; font-size:12px;}
.ticket-menu button:hover,.ticket-menu button:focus-visible {background:var(--easit-plus-ui-selected);}
.ticket-menu button:disabled {cursor:default; opacity:.45;}
.ticket-note-dialog {box-shadow:var(--easit-plus-ui-shadow); box-sizing:border-box; width:calc(100% - 24px); max-width:362px; max-height:90vh; overflow:auto; padding:16px; border:1px solid var(--easit-plus-ui-border); border-radius:var(--easit-plus-ui-radius); background:var(--easit-plus-ui-surface); color:inherit;}
.ticket-note-dialog::backdrop {background:var(--easit-plus-ui-backdrop);}
.ticket-note-dialog label {display:block; margin:10px 0 5px; font-weight:600;}
.ticket-note-dialog select {font:inherit; padding:6px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-surface); color:inherit;}
.ticket-follow-up {display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:10px; font-size:11px;}
.ticket-follow-up button {padding:5px 8px;}
.ticket-note-dialog textarea {font:inherit; line-height:1.5;}

.ticket-handler,.ticket-updated,.ticket-observed {margin-top:3px;}

button.danger {background:#b42318; border-color:var(--easit-plus-ui-danger); color:#fff;}
button.danger:hover {background:#912018; border-color:#912018;}
#snippetFormError,#deleteDataError {color:var(--easit-plus-ui-danger); overflow-wrap:anywhere;}
#snippetFormError:empty,#deleteDataError:empty {display:none;}

.data-actions {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px;}
.data-actions button {min-width:0; font-size:12px;}
.reset-hint {margin:9px 0 0; font-size:11px;}
html[data-embedded] {width:100%; height:100%; max-height:none;}
html[data-embedded]:not([data-popup-ready]) {visibility:hidden;}

.ticket-search {display:block; box-sizing:border-box; width:100%; min-width:0; margin:8px 0 12px; padding:8px 10px; border:1px solid var(--easit-plus-ui-control-border); border-radius:var(--easit-plus-ui-control-radius); background:var(--easit-plus-ui-surface); color:inherit; font:inherit;}
.ticket-search:focus-visible {outline:2px solid var(--easit-plus-primary,#2d8ab3); outline-offset:1px;}
.ticket-row[hidden] {display:none;}

.history-filter-controls {display:flex; align-items:center; gap:6px;}
.history-filter-controls button {font-size:11px; padding:5px 8px;}
#loadHistoryFilterCount {color:var(--easit-plus-ui-muted); font-size:11px;}

#clearLoadHistoryFilter:disabled {cursor:default;}


/* Compact, shared interaction language across all popup panels. */
header {padding:18px 16px 14px; border-bottom:0;}
.brand-icon {border:0; border-radius:var(--easit-plus-ui-radius);}
h1 {font-size:21px; line-height:1.15;}
.popup-tabs {margin:0 12px 10px; padding:3px; gap:3px; border:1px solid var(--easit-plus-ui-border); border-radius:10px; background:var(--easit-plus-ui-canvas);}
.popup-tabs button {border-radius:7px;}
.popup-tabs button[aria-selected="true"] {background:var(--easit-plus-ui-surface); box-shadow:0 1px 4px #00000012;}
.popup-top {padding-bottom:1px; border-bottom:1px solid var(--easit-plus-ui-border);}
.card {padding:14px; border:0; border-radius:8px; box-shadow:none;}
.card h2 {font-size:12px; line-height:1.5;}
#ticketCount,#snippetCount {font-variant-numeric:tabular-nums; color:var(--easit-plus-ui-muted); font-weight:400;}
.ticket-row,.snippet-row {padding:12px 0;}
.ticket-row:first-child,.snippet-row:first-child {border-top:0;}
.ticket-note {border:0; border-radius:6px; padding:8px 10px; max-height:72px; font-size:11px;}
.ticket-meta {display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:11px;}
.ticket-meta strong {font-size:10px; font-weight:600;}
.ticket-meta .ticket-icons {margin:0; gap:4px;}
.ticket-meta .ticket-status {margin-left:auto; font-size:10px;}
.ticket-title {font-size:12px; line-height:1.45; margin:6px 0 4px; font-weight:600;}
.ticket-handler {font-size:10px;}
.ticket-details {margin-top:8px; font-size:10px; color:var(--easit-plus-ui-muted);}
.ticket-details summary {width:max-content; cursor:pointer; padding:2px 0;}
.ticket-dates {padding-top:4px;}
.ticket-dates .ticket-status {font-size:10px;}
.ticket-follow-up {gap:6px; justify-content:space-between; margin-top:9px; font-size:10px; color:var(--easit-plus-ui-muted);}
.ticket-follow-up.is-due {color:var(--easit-plus-ui-text);}
.ticket-follow-up button {padding:3px 6px; font-size:10px; background:transparent; border-color:transparent;}
.ticket-follow-up button:hover {background:var(--easit-plus-ui-hover);}
.ticket-more {min-width:28px; min-height:28px; background:transparent; border-color:transparent;}
.history-stats strong {font-variant-numeric:tabular-nums; letter-spacing:-.5px;}
.ticket-note-dialog h2 {font-size:15px;}
.ticket-note-dialog {padding:18px;}
button,input,textarea,select {transition:background-color var(--easit-plus-ui-fast) ease,border-color var(--easit-plus-ui-fast) ease,box-shadow var(--easit-plus-ui-fast) ease;}
/* These surfaces display color data, so neither theme remapping nor animation
   may change the value shown while dragging a picker control. */
[data-easit-plus-color-value] {transition:none; forced-color-adjust:none;}
input[type=checkbox]::before {transition:transform var(--easit-plus-ui-fast) var(--easit-plus-ui-ease);}
button:active:not(:disabled) {box-shadow:inset 0 1px 3px #00000018;}
button:disabled {cursor:default;}
[role=tabpanel]:not([hidden]),.ticket-menu:not([hidden]) {animation:easit-plus-fade-enter var(--easit-plus-ui-enter) var(--easit-plus-ui-ease);}
dialog[open] {animation:easit-plus-panel-enter var(--easit-plus-ui-enter) var(--easit-plus-ui-ease);}
dialog[open]::backdrop {animation:easit-plus-fade-enter var(--easit-plus-ui-enter) ease;}
@media (forced-colors:active) {
 [data-easit-plus-color-value]:focus-visible {outline-color:CanvasText;}
 input[type=checkbox] {border:1px solid ButtonText; background:Canvas;}
 input[type=checkbox]::before {background:ButtonText;}
 input[type=checkbox]:checked {background:Highlight;}
 .popup-tabs button[aria-selected=true] {outline:1px solid Highlight;}
}

/* Fyra flikar ska rymmas inom popupens fasta bredd. */
.popup-tabs button {min-width:0; padding:8px 5px;}
#saveThemeForm {margin-bottom:12px;}
.theme-grid {display:grid; grid-template-columns:repeat(auto-fill,64px); gap:10px; list-style:none; padding:0; margin:0;}
.theme-grid > .hint {grid-column:1/-1;}
.theme-tile {position:relative; min-width:0;}
.theme-preview[data-easit-plus-color-value] {display:grid; place-items:center; box-sizing:border-box; width:100%; aspect-ratio:1; padding:7px; border:1px solid var(--easit-plus-ui-control-border); border-radius:14px;}
.theme-preview[data-easit-plus-color-value] canvas {display:block; width:39.6px; height:39.6px; max-width:100%; object-fit:contain;}
.theme-preview[data-easit-plus-color-value]:hover {border-color:var(--easit-plus-ui-accent);}
#themeMessage {font-size:12px; overflow-wrap:anywhere;}
.loading-duration > span:first-child {min-width:0; flex:1;}
.loading-duration > span:last-child,.history-filter-controls {flex-shrink:0;}

#themeMenu {width:130px;}

.themes-heading {display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;}
.themes-heading h2 {margin:0;}
.new-theme {display:grid; place-items:center; width:32px; height:32px; padding:0; font-size:24px; line-height:1;}
.theme-dialog h2 {font-size:16px; margin-bottom:8px;}
.theme-dialog .theme-picker {padding:12px 0;}
.theme-dialog .theme-picker+.theme-picker {border-top:1px solid var(--easit-plus-ui-border);}
.theme-dialog-actions {justify-content:flex-end; margin-top:16px;}
#saveTheme {background:var(--easit-plus-ui-action); color:var(--easit-plus-ui-on-action); border-color:var(--easit-plus-ui-action);}
#themeEditorMessage:empty {display:none;}

/* Geometriska symboler centreras oberoende av typsnittets baslinje. */
.symbol-button {position:relative; padding:0;}
.symbol-button::before,.symbol-button::after {content:""; position:absolute; left:50%; top:50%; width:14px; height:2px; border-radius:1px; background:currentColor; transform:translate(-50%,-50%); pointer-events:none;}
.symbol-plus::after {transform:translate(-50%,-50%) rotate(90deg);}
#chooseColor {background:var(--easit-plus-ui-action); color:var(--easit-plus-ui-on-action); border-color:var(--easit-plus-ui-action);}

.theme-dialog label.toggle {display:flex; margin:0;}
.theme-dialog .theme-picker+.toggle {border-top:1px solid var(--easit-plus-ui-border);}

#version {display:inline-flex; align-items:center; gap:4px;}
#version svg {flex:none;}
.ticket-menu {max-height:calc(100vh - 12px); overflow-y:auto; overscroll-behavior:contain;}
#releaseEntries h3 {margin:12px 0 4px; font-size:13px;}
#releaseEntries ul {margin:4px 0 12px; padding-inline-start:1.3em;}
`;

const PAGE_CSS = [UI_CSS, STYLES_CSS, FEEDBACK_CSS].join("\n");

const POPUP_HTML = `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Easit+</title>

  <style>${UI_CSS}</style>
  <style>${POPUP_CSS}</style>
  <style>${FEEDBACK_CSS}</style>

</head>
<body>
  <div class="popup-top">
  <header><div class="brand"><span class="brand-icon" aria-hidden="true">E+</span><div><h1>Easit+</h1><p>Lokala förbättringar för Easit GO</p></div><button id="version" type="button" aria-haspopup="dialog" aria-controls="releaseNotes" title="Visa ändringslogg">
  <span id="versionLabel"></span><span class="sr-only"> – visa ändringslogg</span></button></div></header>
  <div class="popup-tabs" role="tablist" aria-label="Easit+">
    <button id="ticketsTab" type="button" role="tab" aria-selected="true" aria-controls="ticketsPanel" tabindex="0">Ärenden</button>
    <button id="snippetsTab" type="button" role="tab" aria-selected="false" aria-controls="snippetsPanel" tabindex="-1">Textmallar</button>
    <button id="appearanceTab" type="button" role="tab" aria-selected="false" aria-controls="appearancePanel" tabindex="-1">Utseende</button>
    <button id="settingsTab" type="button" role="tab" aria-selected="false" aria-controls="settingsPanel" tabindex="-1">Inställningar</button>
  </div>
  </div>
  <main>
    <section id="snippetsPanel" role="tabpanel" aria-labelledby="snippetsTab" hidden>
    <section class="card" aria-labelledby="snippetsTitle">
      <div class="snippet-title"><h2 id="snippetsTitle">Textmallar <span id="snippetCount">(0)</span></h2><button id="newSnippet" type="button" disabled>Ny mall</button></div>
      <label class="sr-only" for="snippetSearch">Sök i textmallar</label>
      <input id="snippetSearch" class="ticket-search" type="search" maxlength="256" placeholder="Sök textmallar" autocomplete="off" spellcheck="false" aria-controls="snippetList">
      <ul id="snippetList" class="snippet-list" aria-label="Sparade textmallar"></ul>

      <p id="snippetMessage" class="snippet-message" role="status" aria-live="polite"></p>
    </section>
    </section>
    <section id="ticketsPanel" role="tabpanel" aria-labelledby="ticketsTab">
      <section class="card">
        <h2>Sparade ärenden <span id="ticketCount">(0)</span></h2>
        <label class="sr-only" for="ticketSearch">Sök i sparade ärenden</label>
        <input id="ticketSearch" class="ticket-search" type="search" maxlength="256" placeholder="Sök ärenden" autocomplete="off" spellcheck="false" aria-controls="ticketList">
        <p id="ticketsEmpty" class="hint">Inga sparade ärenden.</p>
        <ul id="ticketList" class="ticket-list" aria-label="Sparade ärenden"></ul>
        <p id="ticketsMessage" role="status" aria-live="polite"></p>
      </section>
    </section>
    <section id="appearancePanel" role="tabpanel" aria-labelledby="appearanceTab" hidden>
      <section class="card" aria-labelledby="themesTitle">
        <div class="themes-heading"><h2 id="themesTitle">Teman</h2><button id="newTheme" class="new-theme symbol-button symbol-plus" type="button" aria-label="Skapa tema" title="Skapa tema" disabled></button></div>
        <p class="hint">Välj ett tema. Högerklicka för att radera.</p>
        <ul id="themeList" class="theme-grid" aria-label="Sparade teman"></ul>
        <p id="themeMessage" role="status" aria-live="polite"></p>
      </section>
    </section>
    <section id="settingsPanel" role="tabpanel" aria-labelledby="settingsTab" hidden>
    <fieldset id="settings" disabled>
      <section class="card"><h2>Textmallar</h2>
        <label class="toggle"><span>Visa mallväljare i textfält</span><input id="snippetPickerEnabled" type="checkbox"></label>
        <label class="picker-setting" for="snippetPickerTrigger"><span>Öppna mallväljaren med<small>Till exempel .. i ett textfält.</small></span><input id="snippetPickerTrigger" type="text" required minlength="2" maxlength="20" pattern="\\S{2,20}" autocomplete="off" spellcheck="false" value=".."></label>
      </section>
      <section class="card"><h2>Ärendehantering</h2>
        <label class="toggle"><span>Gruppering som standard<small>Varje tabell minns sitt eget val.</small></span><input id="groupingEnabled" type="checkbox"></label>
        <label class="toggle"><span>Dispatcherstöd för 1st line<small>Visar köantal och föreslår handläggare utifrån senast avlästa kö.</small></span><input id="firstLineWorkloadEnabled" type="checkbox"></label>
        <label class="toggle"><span>Automatisk olästhantering<small>Avmarkerar Oläst e-post vid Skicka och visar knappen Stäng och markera som läst.</small></span><input id="mailUnreadEnabled" type="checkbox"></label>
        <label class="toggle">
          <span><span id="actionsUndoLabel">Återställ text i Åtgärder</span><small id="actionsUndoHelp">Skapar en knapp för att återställa text som Easit tömmer i fältet Åtgärder.</small></span>
          <input id="actionsUndoEnabled" type="checkbox" aria-labelledby="actionsUndoLabel" aria-describedby="actionsUndoHelp">
        </label>
      </section>
      <section class="card"><h2>Laddning</h2>
        <label class="toggle"><span>Visa notis<small>Laddhistoriken sparas även när notisen är avstängd.</small></span><input id="loadingEnabled" type="checkbox"></label>
        <label class="loading-duration" for="loadingShowAfterSeconds"><span>Visa vid laddtid över</span><span><input id="loadingShowAfterSeconds" type="number" required min="0" max="300" step="0.1" value="1"> sek</span></label>
        <label class="loading-duration" for="loadingDismissSeconds"><span>Behåll notisen efter laddning</span><span><input id="loadingDismissSeconds" type="number" required min="1" max="300" step="1" value="10"> sek</span></label>
        <details class="load-history"><summary>Laddhistorik <span id="loadHistoryCount">0/500</span></summary>
          <div class="loading-duration history-filter-row">
            <label for="loadHistoryFilter">Visa laddtider över <span id="loadHistoryFilterCount" aria-live="polite">(0/0)</span></label>
            <div class="history-filter-controls"><input id="loadHistoryFilter" data-history-filter type="number" min="0" max="300" step="0.1" value="0"><span>s</span><button id="clearLoadHistoryFilter" type="button" aria-label="Rensa tidsfilter">Rensa</button></div>
          </div>
          <div class="history-stats"><span>Median<strong id="loadMedian">—</strong></span><span>Längsta<strong id="loadLongest">—</strong></span></div>
          <p id="loadHistoryEmpty" class="hint">Inga mätningar.</p>
          <div class="history-scroll"><table class="history-table"><thead><tr><th>Datum</th><th>Tid</th><th>Mätning</th></tr></thead><tbody id="loadHistoryRows"></tbody></table></div>
          <div class="buttons"><button id="copyLoadHistory" type="button" disabled>Kopiera visade mätningar</button><button id="clearLoadHistory" type="button" disabled>Rensa historik</button></div>
          <p id="loadHistoryMessage" role="status"></p>
        </details>
      </section>
    </fieldset>
    <section class="card"><h2>Säkerhetskopiering</h2><p class="hint">Exportera före avinstallation eller byte av webbläsare.</p>
      <div class="buttons"><button id="export" type="button">Exportera</button><button id="import" type="button">Importera</button></div>
      <input id="importFile" type="file" accept=".json,application/json" hidden>
      <details><summary>Importera inklistrad säkerhetskopia</summary><label class="sr-only" for="importText">Säkerhetskopia</label><textarea id="importText" rows="4" placeholder="Klistra in säkerhetskopia"></textarea><button id="importPasted" type="button">Läs in uppgifter</button></details>
    </section>
    <section class="card"><h2>Återställning och radering</h2>
      <p class="hint">Återställning behåller sparade ärenden, textmallar, teman och laddhistorik.</p>
      <div class="data-actions"><button id="reset" type="button">Återställ inställningar</button><button id="deleteAllData" class="danger" type="button">Radera all Easit+-data</button></div>
    </section>
    <p id="message" role="status" aria-live="polite"></p>
    </section>
  </main>
  <div id="themeMenu" class="ticket-menu" role="menu" aria-label="Temaåtgärder" hidden></div>
  <div id="ticketMenu" class="ticket-menu" role="menu" aria-label="Ärendeåtgärder" hidden></div>
  <dialog id="themeDialog" class="ticket-note-dialog theme-dialog" aria-labelledby="themeDialogTitle" aria-describedby="themeDialogHelp">
    <form id="saveThemeForm">
      <h2 id="themeDialogTitle">Nytt tema</h2>
      <p id="themeDialogHelp" class="hint">Förhandsvisas direkt i popupen och Easit. Textfärgen anpassas automatiskt.</p>
      <fieldset id="appearanceSettings" disabled>
        <div class="theme-picker"><span id="themeColorLabel">Huvudfärg</span><button id="themeColor" class="color-swatch" data-easit-plus-color-value type="button" value="#2d8ab3" aria-labelledby="themeColorLabel" aria-haspopup="dialog"></button></div>
        <div class="theme-picker"><span id="secondaryThemeColorLabel">Bakgrundsfärg</span><button id="secondaryThemeColor" class="color-swatch" data-easit-plus-color-value type="button" value="#ffffff" aria-labelledby="secondaryThemeColorLabel" aria-haspopup="dialog"></button></div>
        <label class="toggle"><span>Snöfall</span><input id="snowfallEnabled" type="checkbox"></label>
      </fieldset>
      <p id="themeEditorMessage" class="hint" role="status" aria-live="polite"></p>
      <div class="buttons theme-dialog-actions"><button id="cancelTheme" type="button">Avbryt</button><button id="saveTheme" type="submit">Spara tema</button></div>
    </form>
  </dialog>
  <dialog id="colorDialog" class="ticket-note-dialog color-dialog" aria-labelledby="colorTitle">
    <div class="color-heading"><h2 id="colorTitle">Huvudfärg</h2><button id="closeColor" type="button" aria-label="Stäng färgväljaren"></button></div>
    <div id="colorPlane" class="color-plane" data-easit-plus-color-value role="group" aria-label="Mättnad och ljusstyrka"><span id="colorCursor" aria-hidden="true"></span></div>
    <label class="sr-only" for="colorHue">Nyans</label><input id="colorHue" class="color-hue" data-easit-plus-color-value type="range" min="0" max="360" step="1" value="0">
    <div class="color-sliders"><label for="colorSaturation">Mättnad</label><input id="colorSaturation" type="range" min="0" max="100" value="100"><label for="colorBrightness">Ljusstyrka</label><input id="colorBrightness" type="range" min="0" max="100" value="100"></div>
    <div class="color-code-row"><span id="colorPreview" data-easit-plus-color-value aria-hidden="true"></span><label class="sr-only" for="colorCode">Färgkod</label><input id="colorCode" type="text" maxlength="32" autocomplete="off" spellcheck="false" aria-describedby="colorError"><label class="sr-only" for="colorFormat">Färgformat</label><select id="colorFormat"><option value="hex">HEX</option><option value="rgb">RGB</option></select></div>
    <p id="colorError" role="status"></p>
    <div class="buttons theme-dialog-actions"><button id="chooseColor" type="button">Välj</button></div>
  </dialog>
  <dialog id="ticketNoteDialog" class="ticket-note-dialog" aria-labelledby="ticketNoteTitle">
    <form id="ticketNoteForm">
      <h2 id="ticketNoteTitle">Redigera anteckning</h2>
      <label for="ticketNoteIcon">Ikon</label>
      <select id="ticketNoteIcon" aria-label="Ikon"><option>📧</option><option>📞</option><option>‼️</option><option>⏳</option><option>📋</option><option>⭐</option></select>
      <label for="ticketNoteText">Anteckning (valfri)</label>
      <textarea id="ticketNoteText" rows="7" maxlength="20000"></textarea>
      <div id="ticketNoteFollowUp"></div>
      <p id="ticketNoteError" role="status"></p>
      <div class="buttons"><button id="ticketNoteSave" type="submit">Spara</button><button id="ticketNoteCancel" type="button">Avbryt</button></div>
    </form>
  </dialog>
  <dialog id="snippetDialog" class="ticket-note-dialog" aria-labelledby="snippetFormTitle">
      <form id="snippetForm">
        <fieldset>
          <h3 id="snippetFormTitle">Ny mall</h3>
          <label for="snippetName">Namn</label><input id="snippetName" type="text" maxlength="100" required placeholder="Signatur" autocomplete="off">
          <label for="snippetTrigger">Textgenväg</label><input id="snippetTrigger" type="text" minlength="2" maxlength="80" required pattern="\\S{2,80}" placeholder=".sign" autocomplete="off" spellcheck="false" autocapitalize="off">
          <label for="snippetText">Text</label><textarea id="snippetText" rows="7" maxlength="20000" required placeholder="Med vänlig hälsning&#10;Ditt namn"></textarea>
          <p id="snippetFormError" role="status"></p>
          <div class="buttons"><button type="submit" id="saveSnippet">Spara mall</button><button type="button" id="cancelSnippet">Avbryt</button></div>
        </fieldset>
      </form>
  </dialog>
  <dialog id="deleteDataDialog" class="ticket-note-dialog" aria-labelledby="deleteDataTitle">
    <h2 id="deleteDataTitle">Radera all Easit+-data?</h2>
    <p>Anteckningar, fästningar, mallar, ärendeuppgifter, inställningar, teman och historik raderas. Det går inte att ångra.</p>
    <p id="deleteDataError" role="status"></p>
    <div class="buttons"><button id="cancelDeleteData" type="button">Avbryt</button><button id="confirmDeleteData" class="danger" type="button">Radera allt</button></div>
  </dialog>
<dialog id="releaseNotes" class="ticket-note-dialog" aria-labelledby="releaseTitle">
  <h2 id="releaseTitle">Ändringslogg</h2><div id="releaseEntries"></div>
  <form method="dialog" class="buttons theme-dialog-actions"><button>Stäng</button></form>
</dialog></body>
</html>
`;

// Initialization order

const PAGE_MODULES = [
  initDocuments,
  initSettings,
  initFeedback,
  initTheme,
  initSidebarSnow,
  initLoading,
  initScope,
  initTickets,
  initNotes,
  initFollowupPicker,
  initReminders,
  initListData,
  initFollowup,
  initAssigneePicker,
  initFirstline,
  initContent,
  initGrouping,
  initIcon,
  initHeaderPopup,
  initMailActions,
  initActionsUndo,
  initSnippets,
  initSnippetUi,
  initSnippetExpander
];

const POPUP_MODULES = [
  initPopupStart,
  initSettings,
  initFeedback,
  initTheme,
  initScope,
  initSnippets,
  initLoadHistory,
  initIcon,
  initNotes,
  initFollowupPicker,
  initTickets,
  initThemePresets,
  initBackup,
  initSnippetPopup,
  initColorPicker,
  initPopup,
  initHistoryPopup,
  initTicketsPopup
];

// Easit page and panel features

/* Follow accessible editor documents, including dynamically written blank frames. */
function initDocuments({document, globalThis, MutationObserver}) {
  if (globalThis.EasitPlusDocuments) return;
  function watch(attach, root = document) {
    const records = new Map();
    function remove(doc) {
      const record = records.get(doc); if (!record) return;
      records.delete(doc); record.observer.disconnect();
      for (const [frame, entry] of record.frames) {
        frame.removeEventListener('load', entry.load); if (entry.doc) remove(entry.doc);
      }
      record.cleanup?.();
    }
    function add(doc) {
      if (!doc || records.has(doc)) return;
      const record = {frames:new Map(), observer:null, cleanup:null}; records.set(doc,record);
      function sync(frame, entry, refresh = false) {
        let next = null;
        try {next = frame.contentDocument;} catch {}
        // document.open()/write()/close() can reuse the Document while clearing
        // its event listeners. Reattach on load even when identity is unchanged.
        if (entry.doc !== next || refresh) {if (entry.doc) remove(entry.doc); entry.doc = next;}
        if (next) add(next);
      }
      function discover(node) {
        if (node.nodeType !== 1 && node.nodeType !== 9) return;
        const frames = [...node.querySelectorAll('iframe,frame')];
        if (node.nodeType === 1 && node.matches('iframe,frame')) frames.unshift(node);
        for (const frame of frames) {
          if (record.frames.has(frame)) continue;
          const entry = {doc:null,load:()=>sync(frame,entry,true)};
          record.frames.set(frame,entry); frame.addEventListener('load',entry.load); sync(frame,entry);
        }
      }
      record.observer = new MutationObserver(mutations=>{
        for (const mutation of mutations) for (const node of mutation.addedNodes) discover(node);
        for (const [frame,entry] of record.frames) if (!frame.isConnected || frame.ownerDocument !== doc) {
          frame.removeEventListener('load',entry.load); record.frames.delete(frame); if (entry.doc) remove(entry.doc);
        }
      });
      record.observer.observe(doc,{childList:true,subtree:true});
      record.cleanup = attach(doc); discover(doc);
    }
    add(root);
    return ()=>{for (const doc of [...records.keys()]) remove(doc);};
  }
  globalThis.EasitPlusDocuments = Object.freeze({watch});
}

function initSettings({globalThis, api}) {
  if(globalThis.EasitPlusSettings)return;
  const KEY = 'easitPlusSettingsV1';
  const DEFAULTS = {
    copyEnabled: true,
    groupingEnabled: false,
    firstLineWorkloadEnabled: true,
    mailUnreadEnabled: true,
    actionsUndoEnabled: true,
    unreadEnabled: true,
    loadingEnabled: true,
    loadingDismissSeconds: 10,
    loadingShowAfterSeconds: 1,
    themeEnabled: false,
    themeColor: '#2d8ab3',
    snowfallEnabled: false,
    secondaryThemeEnabled: false,
    secondaryThemeColor: '#ffffff',
    secondaryThemeTextMode: 'auto',
    snippetPickerEnabled: true,
    snippetPickerTrigger: '..'
  };
  function normalizeColor(value) {
    if(typeof value!=='string')return null;
    let hex=value.trim().replace(/^#/, '');
    if(!/^(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(hex))return null;
    if(hex.length===3)hex=[...hex].map(ch=>ch+ch).join('');
    return '#'+hex.toLowerCase();
  }
  function textIsWhite(mode,background) {
    if(mode==='white')return true;
    if(mode==='black')return false;
    const hex=normalizeColor(background)||'#ffffff';
    const channels=hex.slice(1).match(/../g).map(part=>{const v=parseInt(part,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    const l=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
    return 1.05/(l+.05)>(l+.05)/.05;
  }
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    const result = {};
    for (const key of ['groupingEnabled', 'firstLineWorkloadEnabled', 'actionsUndoEnabled', 'themeEnabled', 'loadingEnabled', 'snowfallEnabled', 'secondaryThemeEnabled', 'snippetPickerEnabled']) {
      result[key] = typeof source[key] === 'boolean' ? source[key] : DEFAULTS[key];
    }
    result.copyEnabled = result.unreadEnabled = true;
    result.mailUnreadEnabled=typeof source.mailUnreadEnabled==='boolean'?source.mailUnreadEnabled:source.mailSendReadEnabled!==false&&source.mailCloseReadEnabled!==false;
    // Preserve earlier choices; the common setting takes precedence once saved.
    for(const key of ['mailSendReadEnabled','mailCloseReadEnabled'])if(typeof source[key]==='boolean')result[key]=source[key];
    result.themeColor=normalizeColor(source.themeColor)||DEFAULTS.themeColor;
    result.secondaryThemeColor=normalizeColor(source.secondaryThemeColor)||DEFAULTS.secondaryThemeColor;
    result.snippetPickerTrigger=typeof source.snippetPickerTrigger==='string'&&/^\S{2,20}$/.test(source.snippetPickerTrigger)?source.snippetPickerTrigger:DEFAULTS.snippetPickerTrigger;
    result.secondaryThemeTextMode='auto';
    result.secondaryThemeWhiteText=textIsWhite('auto',result.secondaryThemeColor);
    result.loadingDismissSeconds=Number.isInteger(source.loadingDismissSeconds)&&source.loadingDismissSeconds>=1&&source.loadingDismissSeconds<=300?source.loadingDismissSeconds:DEFAULTS.loadingDismissSeconds;
    for(const key of ['loadingShowAfterSeconds']) {
      result[key]=Number.isFinite(source[key])&&source[key]>=0&&source[key]<=300&&Math.round(source[key]*10)/10===source[key]?source[key]:DEFAULTS[key];
    }
    return result;
  }
  let current = normalize(DEFAULTS);
  const PREVIEW='easitPlusThemePreviewV1';
  let previewValue = null,sharedPreview=null,previewRevision=0;
  function themePreview(value) {
    if(!value||!normalizeColor(value.themeColor)||!normalizeColor(value.secondaryThemeColor))return null;
    return {themeEnabled:true,secondaryThemeEnabled:true,themeColor:normalizeColor(value.themeColor),secondaryThemeColor:normalizeColor(value.secondaryThemeColor),secondaryThemeTextMode:'auto',snowfallEnabled:value.snowfallEnabled===true};
  }
  let revision = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener());
  api.changes.addListener((changes, area) => {
    if(area!=='local')return;
    if(changes[PREVIEW]){previewRevision++;sharedPreview=themePreview(changes[PREVIEW].newValue);emit();}
    if(!changes[KEY])return;
    revision++;
    current = normalize(changes[KEY].newValue);
    emit();
  });
  const initialRevision = revision,initialPreviewRevision=previewRevision;
  const ready = api.local.get(null).then(result => {
    if(previewRevision===initialPreviewRevision)sharedPreview=themePreview(result[PREVIEW]);
    if (revision === initialRevision) {
      current = normalize(result[KEY]);
      const pickerMigrated=typeof result[KEY]?.snippetPickerEnabled!=='boolean'&&pickerConflict(result,current.snippetPickerTrigger);
      if(pickerMigrated)current.snippetPickerEnabled=false;
      const migrate = result.easitPlusDefaultsV2 !== true;
      if(migrate)current.groupingEnabled=false;
      emit();
      if(migrate || pickerMigrated || result[KEY] && ('colors' in result[KEY] || 'colorsEnabled' in result[KEY] || 'darkMode' in result[KEY] || 'polishedEnabled' in result[KEY]))
        return api.local.set({[KEY]:current,easitPlusDefaultsV2:true});
    }
  });
  function pickerConflict(data,trigger) {
    return Object.entries(data).some(([key,item])=>key.startsWith('easitPlusSnippetV1:')&&typeof item?.trigger==='string'&&(item.trigger.startsWith(trigger)||trigger.startsWith(item.trigger)));
  }
  globalThis.EasitPlusSettings = {
    ready, normalize, normalizeColor, textIsWhite,
    get: () => normalize(previewValue || {...current,...sharedPreview}),
    saved: () => normalize(current),
    preview: value => {previewValue=normalize(value);emit();},
    clearPreview: () => {previewValue=null;emit();},
    defaults: () => normalize(DEFAULTS),
    subscribe: listener => {listeners.add(listener); return () => listeners.delete(listener);},
    save: async value => {
      if(value?.snippetPickerEnabled&&!/^\S{2,20}$/.test(value.snippetPickerTrigger||''))throw new Error('Väljarens trigger ska ha 2–20 tecken utan mellanslag.');
      const normalized=normalize(value),before=revision;
      if(normalized.snippetPickerEnabled&&(!current.snippetPickerEnabled||normalized.snippetPickerTrigger!==current.snippetPickerTrigger)&&pickerConflict(await api.local.get(null),normalized.snippetPickerTrigger))throw new Error('Väljarens trigger krockar med en textmalls trigger. Välj en annan.');
      await api.local.set({[KEY]:normalized});
      if(revision===before){current=normalized;emit();}
    }
  };
}

function noticeCheck(document) {
  const icon = document.createElement('span');
  icon.className = 'easit-plus-notice-check';
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function strokeIcon(document, shape, size = '16') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [name, value] of Object.entries({
    viewBox:'0 0 24 24', width:size, height:size, fill:'none', stroke:'currentColor',
    'stroke-width':'1.8', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', focusable:'false'
  })) svg.setAttribute(name, value);
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', shape);
  svg.append(path);
  return svg;
}

function changelogIcon(document) {
  return strokeIcon(document, 'M3 4v5h5M3.5 9a9 9 0 1 1-.3 5M12 7v5l3 2', '15');
}

function initFeedback({window, document, location, globalThis, copyFeedback}) {
  const MESSAGE = 'easit-plus-copy-feedback-v1';
  const topFrame = window === window.top;
  let stack = null, notice = null, dismiss = null;
  function container() {
    if (!stack?.isConnected) {
      stack = document.createElement('div');
      stack.className = 'easit-plus-notice-stack';
      stack.setAttribute('data-easit-plus-addon', '');
      stack.setAttribute('data-easit-plus-local-ui', '');
      (document.body || document.documentElement).append(stack);
    }
    return stack;
  }
  function mountNotice(element) {
    container().insertBefore(element, notice?.parentNode === stack ? notice : null);
  }
  function clearCountdown(element) {
    const track = element?.querySelector('.easit-plus-timeout-track');
    if (!track) return;
    for (const animation of track.getAnimations({subtree:true})) animation.cancel();
    track.remove();
  }
  function showCountdown(element) {
    const existing = element.querySelector('.easit-plus-timeout-bar');
    if (existing) return existing;
    const track = document.createElement('span');
    track.className = 'easit-plus-timeout-track';
    track.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.className = 'easit-plus-timeout-bar';
    track.append(bar); element.append(track);
    return bar;
  }
  function countdown(element, duration, remaining = duration) {
    if (remaining <= 0) {clearCountdown(element); return;}
    const bar = showCountdown(element);
    for (const animation of bar.getAnimations()) animation.cancel();
    bar.animate([{transform:`scaleX(${Math.min(1, remaining / duration)})`}, {transform:'scaleX(0)'}],
      {duration:remaining, easing:'linear', fill:'forwards'});
  }
  function showCopy() {
    if (copyFeedback) { copyFeedback(); return; }
    if (!topFrame) {
      const origin=document.documentElement?.dataset.embedded==='true'?'https://sjalvservice-it.norrkoping.se':location.origin;
      try {window.top.postMessage({type: MESSAGE}, origin);} catch {}
      return;
    }
    clearTimeout(dismiss);
    if (!notice?.isConnected) {
      notice = document.createElement('div');
      notice.className = 'easit-plus-copy-toast';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.setAttribute('aria-atomic', 'true');
      container().append(notice);
    }
    clearCountdown(notice);
    notice.replaceChildren(noticeCheck(document), 'Kopierat');
    countdown(notice, 2000);
    dismiss = setTimeout(() => {clearCountdown(notice); notice?.remove(); notice = null; dismiss = null;}, 2000);
  }
  function isFrame(source, root = window, depth = 0) {
    if (source === root) return true;
    if (depth > 8) return false;
    try {for (let i = 0; i < root.frames.length; i++) if (isFrame(source, root.frames[i], depth + 1)) return true;} catch {}
    return false;
  }
  if (topFrame) window.addEventListener('message', event => {
    if (event.origin === location.origin && event.data?.type === MESSAGE && isFrame(event.source)) showCopy();
  });
  globalThis.EasitPlusFeedback = {
    mountNotice, showCountdown, countdown, clearCountdown,showCopy,
    copyText: async text => {
      await GM_setClipboard(text);
      showCopy();
    }
  };
}

function initTheme({document, globalThis, Element, Node, HTMLLinkElement, MutationObserver, getComputedStyle, requestAnimationFrame}) {
  const settings=globalThis.EasitPlusSettings;
  const declarations=new Map(), inlineQueue=new Set(), cache=new Map(), inlineApplied=new WeakMap();
  const COLOR_VALUE='[data-easit-plus-color-value]';
  const TABS='.z-tab,.e-modern-tab',tabQueue=new Set(),tabPaint=new Map();
  const ICON='svg,svg *,img,.icon,.message-icon,[class$="-icon"],[class*="-icon "],[class~="fa"],[class~="fas"],[class~="far"],[class~="fal"],[class~="fab"],[class~="fad"],[class~="fat"],[class^="fa-"],[class*=" fa-"],[class^="z-icon-"],[class*=" z-icon-"],.material-icons,.material-symbols-outlined';
  let color=null, secondary=null, whiteText=false, queued=false, sheetsDirty=true, variables=null, observer;
  const TOKEN = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|rgba?\([^)]*\)/gi;
  const NEUTRALS = {white:'#ffffff',black:'#000000',gray:'#808080',grey:'#808080',silver:'#c0c0c0',gainsboro:'#dcdcdc',whitesmoke:'#f5f5f5',lightgray:'#d3d3d3',lightgrey:'#d3d3d3',darkgray:'#a9a9a9',darkgrey:'#a9a9a9',dimgray:'#696969',dimgrey:'#696969',snow:'#fffafa',ivory:'#fffff0',ghostwhite:'#f8f8ff',floralwhite:'#fffaf0',seashell:'#fff5ee'};
  const STATUS_COLORS={red:'#ff0000',darkred:'#8b0000',firebrick:'#b22222',crimson:'#dc143c',maroon:'#800000',green:'#008000',darkgreen:'#006400',forestgreen:'#228b22',seagreen:'#2e8b57',lime:'#00ff00',limegreen:'#32cd32',orange:'#ffa500',darkorange:'#ff8c00',yellow:'#ffff00',gold:'#ffd700',goldenrod:'#daa520',purple:'#800080',indigo:'#4b0082',violet:'#ee82ee',magenta:'#ff00ff',fuchsia:'#ff00ff',pink:'#ffc0cb',hotpink:'#ff69b4',brown:'#a52a2a',coral:'#ff7f50',tomato:'#ff6347',teal:'#008080',turquoise:'#40e0d0'};
  const clamp = (n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  function hsl(r,g,b) {
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;
    let h=0,s=0;
    if(delta){s=delta/(1-Math.abs(2*l-1));h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;h=(h*60+360)%360;}
    return [h,s,l];
  }
  function parse(token) {
    if(token.startsWith('#')) {
      let hex=token.slice(1);if(hex.length===3||hex.length===4)hex=[...hex].map(x=>x+x).join('');
      return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16),hex.length===8?parseInt(hex.slice(6,8),16)/255:1];
    }
    const parts=token.match(/[\d.]+%?/g);if(!parts||parts.length<3)return null;
    return parts.map((x,i)=>x.endsWith('%')?parseFloat(x)*(i<3?2.55:.01):Number(x));
  }
  function rgb(h,s,l) {
    const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
    const values=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return values.map(v=>Math.round(clamp(v+m)*255));
  }
  function luminance(values) {
    return values.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  }
  function contrast(a,b) {
    const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  function readable(foreground,background,minimum=4.5,alpha=1) {
    const ratio=value=>contrast(value.map((v,n)=>v*alpha+background[n]*(1-alpha)),background);
    if(ratio(foreground)>=minimum)return foreground;
    const black=[0,0,0],white=[255,255,255];
    const target=contrast(black,background)>contrast(white,background)?black:white;
    // Keep the chosen hue as far as the contrast requirement permits.
    let low=0,high=1;
    for(let i=0;i<12;i++) {
      const amount=(low+high)/2,mixed=foreground.map((v,n)=>Math.round(v+(target[n]-v)*amount));
      if(ratio(mixed)>=minimum)high=amount;else low=amount;
    }
    return foreground.map((v,n)=>Math.round(v+(target[n]-v)*high));
  }
  function uiPalette(accent,surface) {
    const a=parse(accent).slice(0,3),bg=parse(surface).slice(0,3);
    const on=contrast([0,0,0],a)>contrast([255,255,255],a)?[0,0,0]:[255,255,255];
    const css=value=>`rgb(${value.join(', ')})`;
    return {action:css(a),'on-action':css(on),accent:css(readable(a,bg,3)),
      'accent-text':css(readable(a,bg)),muted:css(readable([100,116,139],bg)),
      danger:css(readable([180,35,24],bg))};
  }
  function role(property) {
    if(/^background(?:-|$)/.test(property)||/^--.*(?:background|surface|canvas)(?:-|$)/.test(property))return 'surface';
    if(property==='color'||property==='caret-color'||property==='fill'||property==='stroke'||/^--.*(?:text|foreground)(?:-|$)/.test(property))return 'text';
    if(/^(?:border|outline)(?:-|$)/.test(property))return 'border';
    return null;
  }
  function secondaryColor(source,kind) {
    const [sh,ss,sl]=hsl(...source),[th,ts,tl]=hsl(...parse(secondary));
    const chroma=(Math.max(...source.slice(0,3))-Math.min(...source.slice(0,3)))/255;
    if(kind==='text') {
      // Only neutral body text follows the canvas contrast. Accent/status
      // colors must survive so the primary palette can still replace blue.
      if(chroma>.2&&ss>.2)return source.slice(0,3);
      if(whiteText&&ss<.12&&sl>.1&&sl<.7)return rgb(th,Math.min(ts,.15),.95-sl*.35);
      return sl<.7?[whiteText?255:0,whiteText?255:0,whiteText?255:0]:source.slice(0,3);
    }
    if(kind==='border') {
      if(chroma>.12&&ss>.2)return source.slice(0,3);
      const light=tl<.45?clamp(tl+.08+(1-sl)*.45):clamp(tl-(1-sl)*(.3+.7*tl));
      const border=rgb(th,ts*.65,light);
      return whiteText?readable(border,parse(secondary).slice(0,3),3,source[3]??1):border;
    }
    // Easit's hover/focus overlays are translucent black on a light canvas.
    // Use the opposite neutral on dark surfaces, retaining the authored alpha.
    if(kind==='surface'&&whiteText&&ss<.12&&sl<.3&&(source[3]??1)<1)return [255,255,255];
    if(kind!=='surface'||sl<.7)return source.slice(0,3);
    const dark=tl<.45,light=clamp(tl+(dark?1:-1)*(1-sl)*(.3+.7*(dark?1-tl:tl)));
    // Near-neutral surfaces use the chosen hue. Distinct pale accent/status
    // surfaces retain their hue, while their brightness fits the new canvas.
    const tint=ss<.12?0:clamp((chroma-.045)/.12);
    const neutral=rgb(th,ts,light),accent=rgb(sh,Math.min(ss,.75),light);
    return neutral.map((value,index)=>Math.round(value*(1-tint)+accent[index]*tint));
  }
  function recolorSecondary(value,kind) {
    if(!secondary||!kind||secondary==='#ffffff'&&kind!=='text')return value;
    const literal=value.replace(/(?<![\w-])([a-z]+)(?![\w-])/gi,name=>NEUTRALS[name.toLowerCase()]||name);
    return literal.replace(TOKEN,token=>{
      const source=parse(token);if(!source||source[3]===0)return token;
      const [r,g,b]=secondaryColor(source,kind),alpha=source[3]??1;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
  }
  function recolor(value,color) {
    if(!value)return value;
    const names={blue:'#0000ff',navy:'#000080',steelblue:'#4682b4',lightblue:'#add8e6',lightskyblue:'#87cefa',skyblue:'#87ceeb',dodgerblue:'#1e90ff',deepskyblue:'#00bfff',royalblue:'#4169e1',aliceblue:'#f0f8ff',cyan:'#00ffff',aqua:'#00ffff',powderblue:'#b0e0e6',cadetblue:'#5f9ea0',lightsteelblue:'#b0c4de',darkblue:'#00008b',mediumblue:'#0000cd',midnightblue:'#191970',cornflowerblue:'#6495ed',slateblue:'#6a5acd',darkslateblue:'#483d8b',mediumslateblue:'#7b68ee',darkcyan:'#008b8b'};
    const literal=value.replace(/(?<![\w-])([a-z]+)(?![\w-])/gi,name=>names[name.toLowerCase()]||name);
    if(!color)return literal;
    const target=parse(color),[h,s,l]=hsl(...target);
    return literal.replace(/#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|rgba?\([^)]*\)/gi,token=>{
      const source=parse(token);if(!source)return token;
      const [sh,ss,sl]=hsl(...source);
      // Även svagt blåtonade ljusa/mörka ytor får samma nya färgfamilj.
      if(sh<175||sh>250||ss<.07||source[3]===0)return token;
      const light=sl<=.43?sl/.43*l:l+(sl-.43)/.57*(1-l);
      const saturation=s===0?0:Math.min(1,ss*s/.65);
      const [r,g,b]=rgb(h,saturation,light),alpha=source[3]??1;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
  }
  function isUnread(element) {
    const marker=element.closest('.color-rule-marker[title]');
    return marker?.title.trim().toLocaleLowerCase('sv')==='oläst e-post';
  }
  function textContrast(value,surface=null,minimum=4.5) {
    if(!surface&&(!secondary||luminance(parse(secondary))>=.25))return value;
    const background=surface||parse(secondary).slice(0,3);
    const literal=value.replace(/(?<![\w-])([a-z]+)(?![\w-])/gi,name=>STATUS_COLORS[name.toLowerCase()]||name);
    return literal.replace(TOKEN,token=>{
      const source=parse(token),alpha=source?.[3]??1;
      if(!source||alpha===0)return token;
      const foreground=source.slice(0,3);
      const binary=surface&&minimum===4.5&&contrast(foreground.map((v,n)=>v*alpha+background[n]*(1-alpha)),background)<minimum;
      const adjusted=binary?blackOrWhite(background):readable(foreground,background,minimum,alpha);
      if(adjusted.every((v,n)=>v===foreground[n])&&(!binary||alpha===1))return token;
      return `rgba(${adjusted.join(', ')}, ${binary?1:alpha})`;
    });
  }
  function mapped(value,property='',surface=null) {
    if(!color&&!secondary)return value;
    if(property.startsWith('--easit-plus-native-select-'))return value;
    // SVG paint belongs to the application's icons, not its text palette.
    if(property==='fill'||property==='stroke')return value;
    // Our controls already use role-specific live palette variables. Rewriting
    // their var() shorthands through CSSOM can freeze a previous theme's color.
    if(/var\(\s*--easit-plus-/.test(value))return value;
    const kind=role(property),key=property+'|'+value+'|'+(surface?.join(',')||'');
    if(!cache.has(key)) {
      // Länkar till bildresurser ändras aldrig.
      const paint=part=>{
        if(kind==='text')return textContrast(recolor(recolorSecondary(part,kind),color),surface);
        const result=recolorSecondary(recolor(part,color),kind);
        return kind==='border'&&whiteText&&surface?textContrast(result,surface,3):result;
      };
      let result=value.split(/(url\([^)]*\))/gi).map(part=>/^url\(/i.test(part)?part:paint(part)).join('');
      if(secondary&&kind)result=result.replace(/var\(\s*--easit-plus-([a-f0-9]{6})(?=\s*[,\)])/gi,(_,hex)=>`var(--easit-plus-${kind}-${hex}`);
      cache.set(key,result);
    }
    return cache.get(key);
  }
  function selectorParts(value,compounds=false) {
    const parts=[];let depth=0,quote='',start=0;
    for(let i=0;i<value.length;i++) {
      const char=value[i];if(char==='\\'){i++;continue;}
      if(quote){if(char===quote)quote='';continue;}
      if(char==='"'||char==="'"){quote=char;continue;}
      if(char==='('||char==='['){depth++;continue;}
      if(char===')'||char===']'){depth--;continue;}
      if(!depth&&(compounds?/[\s>+~]/.test(char):char===',')){const part=value.slice(start,i).trim();if(part)parts.push(part);start=i+1;}
    }
    const last=value.slice(start).trim();if(last)parts.push(last);return parts;
  }
  function iconSelector(selector) {
    const target=selectorParts(selector,true).at(-1)||'';
    // Target the icon, not neighboring text or controls elsewhere in a selector.
    return /^(?:i|svg|img|path|use)(?=[.#:]|$)/i.test(target)||
      /\.(?:fa[bsrldst]?|fa-[\w-]+|z-icon-[\w-]+|icon(?:-[\w-]+)?|[\w-]+-icon|material-icons|material-symbols-outlined)(?=[.#:]|$)/.test(target)||
      /\.icon(?:[\s>]|$)/.test(selector)&&/^(?:div|span)(?=[.#:]|$)/i.test(target);
  }
  function iconPaint(style,element) {
    return element?Boolean(element.closest(ICON)):selectorParts(style.parentRule?.selectorText||'').some(iconSelector);
  }
  function surfaceFor(style,entries,original=false) {
    if(!color&&!secondary)return null;
    // A shorthand's computed longhand may already contain the previous theme.
    // Prefer tracked authored declarations before reading those aliases.
    const tracked=entries?Array.from(entries.keys()).filter(property=>property==='background'||property==='background-color'):[];
    const properties=new Set([...tracked,'background-color','background']);
    for(const property of properties) {
      const actual=style.getPropertyValue(property),old=entries?.get(property);
      const source=old&&actual===old.applied&&style.getPropertyPriority(property)===old.appliedPriority?old.original:actual;
      let value=(original?source:mapped(source,property)).trim();
      if(!/^(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i.test(value)){
        const probe=document.createElement('span').style;probe.setProperty(property,value);value=probe.backgroundColor;
      }
      if(!/^(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i.test(value))continue;
      const rgba=parse(value);if(!rgba||rgba[3]===0)continue;
      const alpha=rgba[3]??1,bg=parse(secondary||'#ffffff');
      return rgba.slice(0,3).map((v,n)=>v*alpha+bg[n]*(1-alpha));
    }
    return null;
  }
  function blackOrWhite(background) {
    return contrast([0,0,0],background)>=contrast([255,255,255],background)?[0,0,0]:[255,255,255];
  }
  function whitePaint(source) {
    const literal=source.trim().toLowerCase()==='white'?'#ffffff':source;
    if(!/^(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i.test(literal))return false;
    const paint=parse(literal);return paint&&paint.slice(0,3).every(v=>v>=250)&&paint[3]!==0;
  }
  function sidebarSelector(selector) {
    return /(?:^|[\s>+~])\.menuComponent(?=[\s.#:[>+~]|$)/.test(selector)&&/(?:^|[\s>+~])\.menu-left(?=[\s.#:[>+~]|$)/.test(selector);
  }
  function sidebarPaint(style,element,property,source) {
    if(property==='color'?!whitePaint(source):role(property)!=='surface')return null;
    const selectors=selectorParts(style.parentRule?.selectorText||'');
    const sidebar=element?Boolean(element.closest('.menuComponent .menu-left')):selectors.length&&selectors.every(sidebarSelector);
    if(!sidebar)return null;
    if(property==='color'&&whitePaint(source))return source;
    // Native menu rows use white overlays on the primary-colored menu root,
    // not surfaces on the secondary page canvas. Keep that layering intact.
    const rootOrRow=element?element.matches('.menu-left,.menu-content-row'):selectors.every(selector=>/\.(?:menu-left|menu-content-row)(?=[.#[:]|$)/.test(selectorParts(selector,true).at(-1)||''));
    if(rootOrRow&&role(property)==='surface')return recolor(source,color);
    return null;
  }
  function nativeWhiteButton(style,element,source,surface,entries) {
    if(!surface||!whitePaint(source))return false;
    const button=element?element.matches('button,.z-button,[role="button"]'):selectorParts(style.parentRule?.selectorText||'').some(selector=>/^(?:button(?=[.#[:]|$))|\.(?:z-button|button-[\w-]+)(?=[.#[:]|$)/i.test(selectorParts(selector,true).at(-1)||''));
    if(!button)return false;
    const before=surfaceFor(style,entries,true);
    return before&&before.every((value,index)=>Math.abs(value-surface[index])<.5);
  }
  function patch(style,element=null) {
    let entries=declarations.get(style);
    const surface=surfaceFor(style,entries);
    // Picker colors represent values, including their white/black endpoints.
    // The surrounding dialog still uses the normal live theme palette.
    if(element && (isUnread(element)||element.closest(COLOR_VALUE))) {
      if(entries)restore(style,entries);
      declarations.delete(style);inlineApplied.set(element,style.cssText);return;
    }
    const properties=new Set([...Array.from(style),...(entries?.keys()||[])]);
    // Unresolved var() shorthands can enumerate as empty longhands in CSSOM.
    // Read their authored shorthand as well, so surface/text/border variables
    // can use separate palettes without touching the application's variables.
    for(const property of ['background','border','border-color','border-top','border-right','border-bottom','border-left','outline']) {
      if(style.getPropertyValue(property).includes('var('))properties.add(property);
    }
    for(const property of properties) {
      const old=entries?.get(property);
      const actual=style.getPropertyValue(property),priority=style.getPropertyPriority(property);
      const source=old&&actual===old.applied&&priority===old.appliedPriority?old.original:actual;
      const originalPriority=old&&actual===old.applied&&priority===old.appliedPriority?old.priority:priority;
      const kind=role(property);
      const preserve=property==='color'&&(iconPaint(style,element)||nativeWhiteButton(style,element,source,surface,entries));
      const menu=sidebarPaint(style,element,property,source);
      const output=menu??(preserve?source:mapped(source,property,kind==='text'||kind==='border'?surface:null));
      if(output===source && !old)continue;
      if(!entries){entries=new Map();declarations.set(style,entries);}
      const record={original:source,priority:originalPriority,applied:output,appliedPriority:originalPriority,element};entries.set(property,record);
      if(actual!==output||priority!==originalPriority) {
        if(output)style.setProperty(property,output,originalPriority);else style.removeProperty(property);
      }
      record.applied=style.getPropertyValue(property);
    }
    if(element)inlineApplied.set(element,style.cssText);
  }
  function restore(style,entries) {
    for(const [property,record] of entries) {
      // En senare ändring från Easit får inte skrivas över vid återställning.
      if(style.getPropertyValue(property)!==record.applied || style.getPropertyPriority(property)!==record.appliedPriority)continue;
      if(record.original)style.setProperty(property,record.original,record.priority);else style.removeProperty(property);
    }
  }
  function scanRules(rules) {
    for(const rule of Array.from(rules)) {
      // A native rule may share its declarations between text and icon targets.
      // Separate those groups so preserving icon color cannot suppress text theming.
      if(rule.selectorText&&!rule.selectorText.includes(COLOR_VALUE)&&!rule.selectorText.includes('.color-rule-marker')&&!rule.cssRules?.length) {
        const selectors=selectorParts(rule.selectorText),icons=selectors.filter(iconSelector);
        if(icons.length&&icons.length<selectors.length) {
          const parent=rule.parentRule||rule.parentStyleSheet,index=Array.from(parent.cssRules).indexOf(rule);
          try {
            parent.insertRule(`${icons.join(',')}{${rule.style.cssText}}`,index+1);
            rule.selectorText=selectors.filter(selector=>!iconSelector(selector)).join(',');
            patch(parent.cssRules[index+1].style);
          } catch { /* Unsupported grouping rules keep their original selector. */ }
        }
      }
      if(rule.style && !rule.selectorText?.includes('.color-rule-marker') && !rule.selectorText?.includes(COLOR_VALUE))patch(rule.style);
      try {if(rule.cssRules)scanRules(rule.cssRules);else if(rule.styleSheet)scanRules(rule.styleSheet.cssRules);}catch{}
    }
  }
  function scanSheets() {
    for(const sheet of document.styleSheets) {
      if(sheet.ownerNode===variables)continue;
      try {scanRules(sheet.cssRules);}catch{}
    }
  }
  // Färger i skriptets egna CSS har alltid en snabb variabelväg.
  const LOCAL_COLORS=["000000", "ffffff", "154b63", "175a9b", "243247", "245b43", "253444", "267c9f", "379668", "42546d", "475569", "64748b", "667982", "94a3b8", "a9b2b8", "adc6e5", "b9cce8", "c5d3da", "cbd5e1", "d3dfe4", "dbe7ed", "dce7f2", "e0f7ff", "e2e8f0", "e8f0fe", "eaf0f6", "edf1f7", "edf2f4", "f1f5f9", "f4f7fb", "f8fafc"];
  function updateVariables() {
    if(!variables){variables=document.createElement('style');variables.setAttribute('data-easit-plus-theme-style','');(document.head||document.documentElement).append(variables);}
    const values=LOCAL_COLORS.map(hex=>`--easit-plus-${hex}:${mapped('#'+hex)};`+['text','surface','border'].map(kind=>`--easit-plus-${kind}-${hex}:${mapped('#'+hex,kind==='text'?'color':kind==='surface'?'background-color':'border-color')};`).join('')).join('');
    const canvas=secondary?`:root{color-scheme:${luminance(parse(secondary))<.25?'dark':'light'};}:where(html){background-color:${secondary};}:where(input:not([type=color]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]),textarea,select){background-color:${secondary};color:${mapped('#243247','color')};}`:'';
    const palette=uiPalette(color||'#2d8ab3',secondary||'#ffffff');
    const ui=Object.entries(palette).map(([name,value])=>`--easit-plus-ui-${name}:${value};`).join('');
    const infoIcon='.z-toast.z-toast-info > .z-toast-icon.z-icon-info-circle';
    const infoColor=color?`${infoIcon},${infoIcon}::before{color:var(--easit-plus-primary) !important;}`:'';
    variables.textContent=`:root{${values}${ui}--easit-plus-primary:${color||'#2d8ab3'};}${canvas}${infoColor}.color-rule-marker[title="Oläst e-post"]{background-color:#99ffff !important;}`;
  }
  function queueTabs(node) {
    if(!(node instanceof Element))return;
    const tab=node.closest(TABS);if(tab)tabQueue.add(tab);
    node.querySelectorAll(TABS).forEach(tab=>tabQueue.add(tab));
  }
  function restoreTabs(all=false) {
    for(const [node,record]of tabPaint) {
      if(!all&&node.isConnected&&!tabQueue.has(record.tab))continue;
      if(node.style.getPropertyValue('color')===record.applied&&node.style.getPropertyPriority('color')==='important') {
        if(record.original)node.style.setProperty('color',record.original,record.priority);else node.style.removeProperty('color');
      }
      tabPaint.delete(node);
    }
  }
  function tabBackground(node,cache) {
    if(!node)return parse(secondary||'#ffffff').slice(0,3);
    if(cache.has(node))return cache.get(node);
    const css=getComputedStyle(node),parent=tabBackground(node.parentElement,cache);
    const paint=/^rgba?\(/.test(css.backgroundColor)?parse(css.backgroundColor):null;
    const alpha=paint?.[3]??1;
    let result=parent;
    if(css.backgroundImage!=='none')result=null;
    else if(paint&&alpha===1)result=paint.slice(0,3);
    else if(paint&&alpha>0)result=parent?paint.slice(0,3).map((value,index)=>value*alpha+parent[index]*(1-alpha)):null;
    cache.set(node,result);return result;
  }
  function applyTabContrast() {
    const backgrounds=new Map(),fixes=[];
    for(const tab of tabQueue) {
      if(!tab.isConnected||tab.matches('.z-tab-disabled,[aria-disabled="true"]'))continue;
      const targets=tab.querySelectorAll('.z-tab-text,.z-label');
      for(const node of targets) {
        if(node.closest(TABS)!==tab||node.closest(ICON+','+COLOR_VALUE))continue;
        const css=getComputedStyle(node),surface=tabBackground(node,backgrounds);
        if(!surface||!/^rgba?\(/.test(css.color))continue;
        const paint=parse(css.color),alpha=paint[3]??1;if(alpha===0)continue;
        const foreground=paint.slice(0,3).map((value,index)=>value*alpha+surface[index]*(1-alpha));
        if(contrast(foreground,surface)>=4.5)continue;
        fixes.push({node,tab,value:`rgb(${blackOrWhite(surface).join(', ')})`});
      }
    }
    // Batch all computed-style reads before writes; only native tab text is measured.
    for(const {node,tab,value}of fixes) {
      const record={tab,original:node.style.getPropertyValue('color'),priority:node.style.getPropertyPriority('color')};
      node.style.setProperty('color',value,'important');record.applied=node.style.getPropertyValue('color');tabPaint.set(node,record);
    }
    tabQueue.clear();
  }
  function addInline(node) {
    if(!(node instanceof Element)||node===variables||node.closest('[data-easit-plus-theme-style]'))return;
    queueTabs(node);
    if(node.hasAttribute('style')||declarations.has(node.style))inlineQueue.add(node);
    node.querySelectorAll('[style]').forEach(element=>inlineQueue.add(element));
  }
  function schedule() {
    if(queued)return;queued=true;requestAnimationFrame(apply);
  }
  function watch() {
    observer.observe(document,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','title','class']});
  }
  function apply() {
    queued=false;observer.disconnect();
    try {
      const value=settings.get(),next=value.themeEnabled?value.themeColor:null,nextSecondary=value.secondaryThemeEnabled?value.secondaryThemeColor:null,nextWhiteText=value.secondaryThemeWhiteText;
      const changed=next!==color||nextSecondary!==secondary||nextWhiteText!==whiteText;
      if(changed||sheetsDirty)queueTabs(document.documentElement);
      restoreTabs(!next&&!nextSecondary);
      if(changed) {
        const wasEnabled=Boolean(color||secondary),hadSurfaces=Boolean(secondary&&secondary!=='#ffffff');color=next;secondary=nextSecondary;whiteText=nextWhiteText;cache.clear();
        if(!color&&!secondary) {
          for(const [style,entries]of declarations)restore(style,entries);
          declarations.clear();inlineQueue.clear();tabQueue.clear();variables?.remove();variables=null;sheetsDirty=true;return;
        }
        // Tidigare färgposter återanvänder ursprungsvärdet, utan style/layout-läsningar.
        for(const [style,entries]of declarations) {
          const element=entries.values().next().value?.element;
          if(element&&!element.isConnected){declarations.delete(style);continue;}
          patch(style,element);
        }
        if(!wasEnabled||hadSurfaces!==Boolean(secondary&&secondary!=='#ffffff')){sheetsDirty=true;addInline(document.documentElement);}
        updateVariables();
      }
      if(!color&&!secondary){tabQueue.clear();return;}
      if(sheetsDirty){scanSheets();sheetsDirty=false;}
      for(const element of inlineQueue)if(element.isConnected)patch(element.style,element);
      inlineQueue.clear();
      applyTabContrast();
    }finally{watch();}
  }
  observer=new MutationObserver(records=>{
    if(!color&&!secondary)return;
    for(const record of records) {
      if(record.target===variables||record.target.parentElement===variables)continue;
      const target=record.target instanceof Element?record.target:record.target.parentElement;
      if(target?.closest(TABS))queueTabs(target);
      if(target?.matches('style')){sheetsDirty=true;continue;}
      if(record.type==='attributes') {
        if(record.attributeName==='class')continue;
        if(record.attributeName==='style' && inlineApplied.get(target)===target.style.cssText)continue;
        if(record.attributeName==='title')addInline(target);else inlineQueue.add(target);
      }
      for(const node of record.removedNodes) {
        if(!(node instanceof Element)||node.isConnected)continue;
        queueTabs(node);
        declarations.delete(node.style);node.querySelectorAll('[style]').forEach(element=>declarations.delete(element.style));
      }
      for(const node of record.addedNodes) {
        if(node instanceof Element&&(node.matches('style,link')||node.querySelector('style,link')))sheetsDirty=true;
        addInline(node);
      }
    }
    if(sheetsDirty||inlineQueue.size||tabQueue.size)schedule();
  });
  for(const type of ['pointerover','pointerout','focusin','focusout'])document.addEventListener(type,event=>{
    if(!color&&!secondary)return;
    const tab=event.target instanceof Element?event.target.closest(TABS):null;
    if(!tab||event.relatedTarget instanceof Node&&tab.contains(event.relatedTarget))return;
    queueTabs(tab);schedule();
  },true);
  document.addEventListener('transitionend',event=>{
    if((color||secondary)&&event.propertyName==='background-color'&&event.target instanceof Element&&event.target.closest(TABS)){queueTabs(event.target);schedule();}
  },true);
  watch();
  document.addEventListener('load',event=>{if((color||secondary)&&event.target instanceof HTMLLinkElement){sheetsDirty=true;schedule();}},true);
  const ready=settings.ready.then(apply);
  globalThis.EasitPlusTheme={recolor,ready,flush:apply,uiPalette};
  settings.subscribe(schedule);ready.catch(()=>{});
}

/* Local decoration for Easit's navigation; CSS animates a bounded, reusable pool. */
function initSidebarSnow({document, globalThis, Element, MutationObserver, getComputedStyle, matchMedia}) {
  const settings=globalThis.EasitPlusSettings;
  const selector='.menuComponent .menu-left',records=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),forced=matchMedia('(forced-colors: active)');
  let watching=false,scheduled=false;
  function remove(menu,record) {
    record.resize.disconnect();record.host.remove();
    menu.removeAttribute('data-easit-plus-snow');
    if(record.positioned&&menu.style.getPropertyValue('position')==='relative'&&!menu.style.getPropertyPriority('position')) {
      if(record.position)menu.style.setProperty('position',record.position,record.priority);
      else menu.style.removeProperty('position');
    }
    if(menu.style.getPropertyValue('isolation')==='isolate'&&!menu.style.getPropertyPriority('isolation')) {
      if(record.isolation)menu.style.setProperty('isolation',record.isolation,record.isolationPriority);
      else menu.style.removeProperty('isolation');
    }
    records.delete(menu);
  }
  function mount(menu) {
    const host=document.createElement('easit-plus-sidebar-snow');
    host.setAttribute('aria-hidden','true');
    const root=host.attachShadow({mode:'open'});
    // Keep the white flakes out of the page's theme recoloring and global CSS.
    root.innerHTML=`<style>
      :host{all:initial;display:block;position:absolute;inset:0;z-index:-1;overflow:hidden;border-radius:inherit;pointer-events:none!important;user-select:none;contain:strict}
      i{position:absolute;top:-8px;left:var(--x);width:var(--size);height:var(--size);border-radius:50%;background:#fff;pointer-events:none;
        animation:snow-fall var(--duration) linear var(--delay) infinite;opacity:0}
      :host([data-paused]) i{animation-play-state:paused}
      @keyframes snow-fall{
        0%{opacity:0;transform:translate3d(0,0,0)}
        10%,80%{opacity:var(--opacity)}
        100%{opacity:0;transform:translate3d(var(--drift),calc(var(--fall-distance) + 16px),0)}
      }
      @media(prefers-reduced-motion:reduce),(forced-colors:active){:host{display:none}i{animation:none}}
    </style>`;
    const original=getComputedStyle(menu),record={host,positioned:original.position==='static',position:menu.style.getPropertyValue('position'),priority:menu.style.getPropertyPriority('position'),isolation:menu.style.getPropertyValue('isolation'),isolationPriority:menu.style.getPropertyPriority('isolation'),resize:null};
    if(record.positioned)menu.style.setProperty('position','relative');
    // Negative stacking keeps snow behind text/icons, but above the menu background.
    menu.style.setProperty('isolation','isolate');
    menu.setAttribute('data-easit-plus-snow','');menu.prepend(host);
    record.resize=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      record.visible=width>0&&height>0;
      host.toggleAttribute('data-paused',document.hidden||!record.visible);
      host.style.setProperty('--fall-distance',height+'px');
      const baseCount=Math.max(8,Math.min(48,Math.ceil(width*height/12000)));
      const count=record.visible?Math.round(baseCount*1.2):0;
      const flakes=[...root.querySelectorAll('i')];
      for(const flake of flakes.slice(count))flake.remove();
      for(let index=flakes.length;index<count;index++) {
        const flake=document.createElement('i'),duration=5+Math.random()*7;
        for(const [name,value]of Object.entries({x:(Math.random()*100)+'%',size:(1+Math.random()*4)+'px',duration:duration+'s',delay:(-Math.random()*duration)+'s',drift:(Math.random()*42-21)+'px',opacity:String(.3+Math.random()*.45)}))flake.style.setProperty('--'+name,value);
        root.append(flake);
      }
    });
    records.set(menu,record);record.resize.observe(menu);
  }
  function sync() {
    scheduled=false;
    if(!watching)return;
    const menus=new Set(document.querySelectorAll(selector));
    for(const [menu,record]of records)if(!menus.has(menu)||!record.host.isConnected)remove(menu,record);
    for(const menu of menus)if(!records.has(menu))mount(menu);
  }
  function schedule() {if(watching&&!scheduled){scheduled=true;queueMicrotask(sync);}}
  const menuClass=/(?:^|\s)(?:menuComponent|menu-left)(?:\s|$)/;
  const observer=new MutationObserver(mutations=>{
    for(const record of mutations) {
      if(record.type==='attributes') {
        if(menuClass.test(record.oldValue||'')||menuClass.test(record.target.className||'')){schedule();return;}
      }else {
        if([...records.keys()].some(menu=>!menu.isConnected||!records.get(menu).host.isConnected)){schedule();return;}
        for(const node of record.addedNodes)if(node instanceof Element&&(node.matches('.menuComponent,.menu-left')||node.querySelector('.menuComponent,.menu-left'))){schedule();return;}
      }
    }
  });
  function apply() {
    const enabled=settings.get().snowfallEnabled&&!reduced.matches&&!forced.matches;
    if(enabled&&!watching) {
      watching=true;observer.observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
      sync();
    }else if(!enabled&&watching) {
      watching=false;observer.disconnect();
      for(const [menu,record]of records)remove(menu,record);
    }
  }
  document.addEventListener('visibilitychange',()=>{
    for(const record of records.values())record.host.toggleAttribute('data-paused',document.hidden||!record.visible);
  });
  reduced.addEventListener('change',apply);forced.addEventListener('change',apply);
  settings.subscribe(apply);settings.ready.then(apply).catch(()=>{});
}

function initLoading({window, document, globalThis, api, Element, MutationObserver, getComputedStyle}) {
  if (window !== window.top) return;
  const settings = globalThis.EasitPlusSettings, MESSAGE = 'easit-plus-click-loading-v2';
  const showAfterMs = () => (settings.get().loadingShowAfterSeconds ?? 1)*1000;
  let latest = null, revision = -1, ready = false, enabled = true;
  let toast = null, title = null, detail = null, symbol = null, copy = null, timer = null, dismiss = null;
  let phaseStart = null, startedAt = null, elapsed = 0, ended = null, activeCount = 0;
  let cycleId = null, settlingAt = null, completedAt = null;
  let iconPending = false, dismissedCycle = null;
  let stopped = false, stopWatching = null, unsubscribe = null, listening = false;
  const iconDocuments = new Map();
  let scanQueued = false, reportedBusy = null, iconPoll = null;
  const pointerEvents = ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu'];
  const seconds = value => `${(Math.max(0,value)/1000).toLocaleString('sv-SE',{minimumFractionDigits:1,maximumFractionDigits:1})} s`;
  function stop() {
    if (stopped) return;
    stopped = true; ready = false; latest = null;
    clearMoment(); clearInterval(iconPoll); iconPoll = null;
    stopWatching?.(); stopWatching = null; iconDocuments.clear();
    unsubscribe?.(); unsubscribe = null;
    for (const type of pointerEvents) window.removeEventListener(type,onPointer,true);
    window.removeEventListener('keydown',onKey,true);
    try {if (listening) api.messages.removeListener(receive);} catch {}
    listening = false;
  }
  function send(message, failed = () => {}) {
    if (!stopped) api.send(message).then(receive).catch(failed);
  }
  function buildToast() {
    toast = document.createElement('aside'); toast.className = 'easit-plus-loading-toast';
    toast.setAttribute('data-easit-plus-ui',''); toast.setAttribute('data-easit-plus-addon',''); toast.setAttribute('aria-label','Laddningstid');
    title = document.createElement('div'); title.className = 'easit-plus-loading-title'; title.setAttribute('role','status'); title.setAttribute('aria-live','polite');
    detail = document.createElement('div'); detail.className = 'easit-plus-loading-detail'; detail.setAttribute('aria-live','off');
    copy = document.createElement('button'); copy.type = 'button'; copy.className = 'easit-plus-loading-copy'; copy.setAttribute('aria-label','Kopiera datum och laddtid'); copy.disabled = true;
    const close = document.createElement('button'); close.type = 'button'; close.className = 'easit-plus-loading-close'; close.title = 'Stäng notisen'; close.setAttribute('aria-label','Stäng laddnotisen');
    symbol = document.createElement('span'); symbol.className = 'easit-plus-loading-symbol'; symbol.setAttribute('aria-hidden','true');
    copy.title = 'Tillgängligt när alla anrop är klara'; toast.append(title,detail,copy,close,symbol); globalThis.EasitPlusFeedback.mountNotice(toast);
    globalThis.EasitPlusFeedback.showCountdown(toast);
  }
  function hideToast() {
    globalThis.EasitPlusFeedback.clearCountdown(toast);
    toast?.remove(); toast = copy = null;
  }
  function clearMoment() {
    clearInterval(timer); clearTimeout(dismiss); timer = dismiss = null;
    hideToast(); phaseStart = startedAt = ended = cycleId = settlingAt = completedAt = null; elapsed = activeCount = 0; iconPending = false;
  }
  function render() {
    if (stopped) return;
    const active = phaseStart !== null, duration = active ? (settlingAt ?? Date.now())-phaseStart : elapsed;
    if (!startedAt || dismissedCycle === cycleId) return;
    if (duration <= showAfterMs()) {if(toast)hideToast();return;}
    if (!toast) buildToast();
    toast.dataset.loading = String(active);
    const status = active ? (activeCount || iconPending ? 'Sidan laddar…' : 'Slutför laddning…') : 'Laddningen är klar';
    if (title.textContent !== status) title.textContent = status;
    copy.disabled = active;
    copy.title = active ? 'Tillgängligt när laddningen är klar' : 'Kopiera den färdiga mätningen';
    detail.textContent = seconds(duration);
    symbol.title = active ? (activeCount || iconPending ? `Pågående anrop: ${activeCount}` : 'Slutför laddning…') : 'Laddningen är klar';
  }
  function scheduleDismiss() {
    clearTimeout(dismiss); dismiss = null;
    if (toast && ended !== null) {
      const duration = settings.get().loadingDismissSeconds * 1000;
      const remaining = Math.max(0, completedAt + duration - Date.now());
      globalThis.EasitPlusFeedback.countdown(toast, duration, remaining);
      dismiss = setTimeout(clearMoment, remaining);
    }
  }
  function start(at,id) {
    dismissedCycle = null; clearMoment(); phaseStart = Math.min(Date.now(),at); startedAt = new Date(phaseStart); cycleId = id;
    timer = setInterval(render,100);
  }
  function complete(at) {
    elapsed = Math.max(0,at-phaseStart); phaseStart = null; ended = at; settlingAt = null; completedAt = Date.now();
    clearInterval(timer); timer = null;
    if (elapsed <= showAfterMs()) {clearMoment(); return;}
    render(); scheduleDismiss();
  }
  function update() {
    if (stopped || !ready || !latest || !enabled) return;
    if (latest.cycle) {
      const cycle = latest.cycle;
      if (phaseStart === null || cycleId !== cycle.id) start(cycle.startedAt,cycle.id);
      activeCount = latest.requests.length;
      iconPending = cycle.iconPending === true;
      settlingAt = activeCount || iconPending ? null : Math.max(phaseStart,cycle.lastAt);
      render();
    } else if (latest.finished) {
      const done = latest.finished;
      if (phaseStart === null || cycleId !== done.id) start(done.startedAt,done.id);
      complete(done.endedAt);
    } else if (latest.cancelled) clearMoment();
  }
  function receive(message) {
    if (stopped) return;
    if (message?.type !== MESSAGE || !Number.isSafeInteger(message.revision) || message.revision < revision || !Number.isFinite(message.at) || !Array.isArray(message.requests)) return;
    // A query can report the completed revision before its final event arrives.
    if (message.revision === revision && !(message.finished && latest?.finished?.id !== message.finished.id) && !(message.cancelled && !latest?.cancelled)) return;
    revision = message.revision;
    const requests = message.requests.filter(item=>typeof item.id === 'string' && Number.isFinite(item.startedAt));
    const done = message.finished;
    const cycle = message.cycle;
    const validCycle = cycle && typeof cycle.id === 'string' && Number.isFinite(cycle.startedAt) && Number.isFinite(cycle.lastAt) ? cycle : null;
    latest = {at:message.at,requests,cycle:validCycle,cancelled:message.cancelled === true,finished:done && typeof done.id === 'string' && Number.isFinite(done.startedAt) && Number.isFinite(done.endedAt) && done.endedAt >= done.startedAt ? done : null};
    update();
  }
  // Keep the candidate list small; no document-wide scan runs on a timer.
  function visible(element) {
    if (!element.isConnected || ![...element.getClientRects()].some(rect=>rect.width > 0 && rect.height > 0)) return false;
    const view = element.ownerDocument.defaultView;
    if (!view) return false;
    const style = view.getComputedStyle(element);
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    for (let parent = element; parent; parent = parent.parentElement) if (view.getComputedStyle(parent).opacity === '0') return false;
    try {return !view.frameElement || visible(view.frameElement);} catch {return false;}
  }
  function scanIcons() {
    scanQueued = false;
    if (stopped) return;
    let busy = false, count = 0;
    for (const candidates of iconDocuments.values()) for (const icon of candidates) {
      if (!icon.isConnected || !icon.matches('.z-loading-icon')) {candidates.delete(icon); continue;}
      count++; if (visible(icon)) busy = true;
    }
    if (count && !iconPoll) iconPoll = setInterval(scheduleIcons,250);
    if (!count && iconPoll) {clearInterval(iconPoll); iconPoll = null;}
    if (busy === reportedBusy) return;
    reportedBusy = busy;
    send({type:'easit-plus-loading-icon-v1',busy},()=>{reportedBusy=null;});
  }
  function scheduleIcons() {if (!stopped && !scanQueued) {scanQueued=true; queueMicrotask(scanIcons);}}
  stopWatching = globalThis.EasitPlusDocuments.watch(doc=>{
    const candidates = new Set(doc.querySelectorAll('.z-loading-icon')); iconDocuments.set(doc,candidates);
    const add = node=>{if (node.nodeType !== 1) return; if (node.matches('.z-loading-icon')) candidates.add(node); for (const icon of node.querySelectorAll('.z-loading-icon')) candidates.add(icon);};
    const observer = new MutationObserver(mutations=>{
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target.matches('.z-loading-icon')) candidates.add(mutation.target);
        if (mutation.type === 'childList') for (const node of mutation.addedNodes) add(node);
      }
      scheduleIcons();
    });
    observer.observe(doc,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','inert','aria-hidden']});
    scheduleIcons();
    return ()=>{observer.disconnect(); iconDocuments.delete(doc); scheduleIcons();};
  });
  async function copyResult() {
    if (stopped || !toast || !startedAt || phaseStart !== null || ended === null || copy.disabled) return;
    const button = copy, stamp = startedAt;
    const date = stamp.toLocaleString('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    try {await GM_setClipboard(`Datum: ${date}\nLaddtid: ${seconds(elapsed)}`); if (startedAt === stamp) {button.dataset.state = 'copied'; button.title = 'Kopierat'; button.setAttribute('aria-label','Kopierat'); title.textContent = 'Kopierat';}}
    catch {if (startedAt === stamp) {button.dataset.state = 'error'; button.title = 'Kunde inte kopiera – försök igen'; button.setAttribute('aria-label',button.title); title.textContent = button.title;}}
  }
  function closeNotice() {
    dismissedCycle = cycleId;
    clearInterval(timer); timer = null;
    clearTimeout(dismiss); dismiss = null;
    globalThis.EasitPlusFeedback.clearCountdown(toast);
    toast?.remove(); toast = copy = null;
  }
  function onPointer(event) {
    if (stopped) return;
    if (!(event.target instanceof Element) || !event.target.closest('.easit-plus-loading-toast')) return;
    event.stopImmediatePropagation();
    if (event.type === 'click') {event.preventDefault(); if (event.target.closest('.easit-plus-loading-close')) closeNotice(); else if (event.target.closest('.easit-plus-loading-copy')) copyResult();}
  }
  for (const type of pointerEvents) window.addEventListener(type,onPointer,true);
  function onKey(event) {
    if (stopped) return;
    if (!toast?.contains(event.target) || !(event.target instanceof Element) || !event.target.closest('.easit-plus-loading-copy,.easit-plus-loading-close') || !['Enter',' '].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.target.closest('.easit-plus-loading-close')) closeNotice(); else copyResult();
  }
  window.addEventListener('keydown',onKey,true);
  unsubscribe = settings.subscribe(()=>{
    if (stopped) return;
    enabled = settings.get().loadingEnabled;
    if (!enabled) clearMoment(); else if (latest?.cycle) update();
    scheduleDismiss();
  });
  settings.ready.then(()=>{if (stopped) return; ready=true; enabled=settings.get().loadingEnabled; update();}).catch(()=>{});
  window.addEventListener('pagehide', event => { if (event.persisted) clearMoment(); else stop(); });
  if (!stopped) {
    try {api.messages.addListener(receive); listening = true;}
    catch {stop();}
  }
  send({type:'easit-plus-click-loading-query-v2'});
}

function initScope({document, location, globalThis, api, Element}) {
  const PREFIX='easitPlusGroupingTableV1:';
  const COLLAPSED='easitPlusCollapsedGroupV1:';
  const preferences=new Map(), collapsed=new Set(), touched=new Set(), identities=new WeakMap(), listeners=new Set();
  const emit=()=>listeners.forEach(fn=>fn());
  function dashboardPanel(list) {
    if (list.closest('.easit-item-form, .eFormFunctionContainer, .easit-function')) return null;
    const panel=list.closest('.z-panel');
    // Dashboard views use a panel instead of the ordinary item-view wrapper.
    const filter=panel?.querySelector('.itemviewmidget-togglefilterbutton');
    if (!filter || filter.closest('.z-panel')!==panel) return null;
    const columns=[...list.querySelectorAll('.z-listheader, .z-column')]
      .filter(header=>header.closest('.z-listbox, .z-grid')===list)
      .map(header=>header.textContent.trim().toLocaleUpperCase('sv'));
    return ['ID','RUBRIK','STATUS'].every(name=>columns.includes(name))?panel:null;
  }
  function isList(list) {
    return !!(list instanceof Element && list.matches('.z-listbox, .z-grid') &&
      !list.closest('.easit-history-function') && list.closest('.paged-itemview-component') &&
      (list.closest('.easit-item-view-widget') || list.closest('.eFormFunctionContainer, .easit-function') || dashboardPanel(list)));
  }
  function isMainList(list) {
    return isList(list) && !list.closest('.eFormFunctionContainer, .easit-function');
  }
  function isCell(cell) {
    return !!(cell instanceof Element && cell.isConnected && isList(cell.closest('.z-listbox, .z-grid')));
  }
  function tableKey(list) {
    if(identities.has(list)) return identities.get(list);
    const main=isMainList(list);
    const dashboard=main&&!list.closest('.easit-item-view-widget')?dashboardPanel(list):null;
    const root=dashboard || (main?list.closest('.easit-item-view-widget'):
      list.closest('.easit-item-form') || list.closest('.eFormFunctionContainer, .easit-function'));
    const path=[];
    for(let node=list;node && node!==root;node=node.parentElement) {
      const siblings=[...(node.parentElement?.children||[])].filter(el=>!el.matches('[data-easit-plus-ui], [data-easit-plus-addon]'));
      const classes=[...node.classList].filter(name=>!name.startsWith('z-') && !name.startsWith('easit-plus-') && !['multiple','position-relative','comp100'].includes(name)).sort();
      path.push([node.tagName,classes,siblings.indexOf(node)]);
    }
    const panelLabel=panel=>{
      const caption=[...panel.querySelectorAll('.z-caption-content')].find(node=>node.closest('.z-panel')===panel)?.cloneNode(true);
      caption?.querySelectorAll('button, [data-easit-plus-ui], [data-easit-plus-addon]').forEach(node=>node.remove());
      return caption?.textContent.replace(/\s+/g,' ').trim() || '';
    };
    const label=dashboard?panelLabel(dashboard):root?.getAttribute('testid') || root?.getAttribute('aria-label') || '';
    const ordinal=dashboard?[...document.querySelectorAll('.z-panel')].filter(panel=>panelLabel(panel)===label).indexOf(root):main?[...document.querySelectorAll('.easit-item-view-widget')].indexOf(root):0;
    const columns=[...list.querySelectorAll('.z-listheader, .z-column')].filter(el=>el.closest('.z-listbox, .z-grid')===list).map(el=>el.textContent.trim().toLocaleUpperCase('sv')).sort();
    const signature=JSON.stringify([location.pathname,dashboard?'dashboard':main?'main':'embedded',label,ordinal,path,columns]);
    let a=2166136261,b=3339675911;
    for(const ch of signature){a=Math.imul(a^ch.charCodeAt(0),16777619);b=Math.imul(b^ch.charCodeAt(0),2246822519);}
    const key=PREFIX+(a>>>0).toString(16)+(b>>>0).toString(16);
    identities.set(list,key);return key;
  }
  api.changes.addListener((changes,area)=>{
    if(area!=='local') return;let changed=false;
    for(const [key,value]of Object.entries(changes)) {
      if(key.startsWith(COLLAPSED)) {
        touched.add(key);if(value.newValue===true)collapsed.add(key);else collapsed.delete(key);changed=true;continue;
      }
      if(!key.startsWith(PREFIX)) continue;touched.add(key);
      if(typeof value.newValue==='boolean') preferences.set(key,value.newValue);else preferences.delete(key);
      changed=true;
    }
    if(changed) emit();
  });
  const ready=api.local.get(null).then(values=>{
    for(const [key,value]of Object.entries(values))if(key.startsWith(PREFIX)&&!touched.has(key)&&typeof value==='boolean')preferences.set(key,value);
    for(const [key,value]of Object.entries(values))if(key.startsWith(COLLAPSED)&&!touched.has(key)&&value===true)collapsed.add(key);
    emit();
  });
  const groupingEnabled=(list,fallback)=>preferences.get(tableKey(list))??fallback;
  async function setGrouping(list,enabled){await ready;await api.local.set({[tableKey(list)]:!!enabled});}
  const collapseKey=(list,status)=>COLLAPSED+tableKey(list).slice(PREFIX.length)+':'+encodeURIComponent(status);
  const isCollapsed=(list,status)=>collapsed.has(collapseKey(list,status));
  async function setCollapsed(list,status,value) {
    await ready;
    const key=collapseKey(list,status);
    if(value)await api.local.set({[key]:true});else await api.local.remove(key);
    // Även om webbläsaren ännu inte har skickat storage.onChanged.
    if(value)collapsed.add(key);else collapsed.delete(key);emit();
  }
  async function resetGrouping(){await ready;const values=await api.local.get(null);const keys=Object.keys(values).filter(key=>key.startsWith(PREFIX)||key.startsWith(COLLAPSED));if(keys.length)await api.local.remove(keys);}
  globalThis.EasitPlusScope={isList,isMainList,isCell,tableKey,groupingEnabled,setGrouping,isCollapsed,setCollapsed,resetGrouping,ready,
    subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
}

function initTickets({globalThis, api}) {
  if (globalThis.EasitPlusTickets) return;
  const PREFIX = 'easitPlusTicketV1:';
  const ORIGIN = 'https://sjalvservice-it.norrkoping.se';
  const records = new Map(), touched = new Set();
  const keyFor = id => PREFIX + encodeURIComponent(id);
  function normalize(value) {
    if (!value || typeof value.id !== 'string' || !value.id.trim() || value.id.length > 1000 ||
        typeof value.title !== 'string' || value.title.length > 2000 ||
        typeof value.status !== 'string' || value.status.length > 500 ||
        value.handler != null && (typeof value.handler !== 'string' || value.handler.length > 500) ||
        value.updated != null && (typeof value.updated !== 'string' || value.updated.length > 500) ||
        !Number.isFinite(value.observedAt) || value.observedAt < 0) return null;
    return {id:value.id, title:value.title, status:value.status, handler:value.handler ?? null, updated:value.updated ?? null, observedAt:value.observedAt};
  }
  api.changes.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
      if (!key.startsWith(PREFIX)) continue;
      touched.add(key);
      const value = normalize(change.newValue);
      if (value) records.set(key, value); else records.delete(key);
    }
  });
  const ready = api.local.get(null).then(data => {
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(PREFIX) || touched.has(key)) continue;
      const record = normalize(value);
      if (record) records.set(key, record);
    }
  });
  // Only called for a marked ticket; unchanged rows cause no storage writes.
  async function remember(snapshot) {
    if (!snapshot) return;
    await ready;
    const key = keyFor(snapshot.id), previous = records.get(key);
    const value = normalize({id:snapshot.id,
      title:(snapshot.title || previous?.title || '').slice(0,2000),
      status:(snapshot.status || previous?.status || '').slice(0,500),
      handler:typeof snapshot.handler==='string'?snapshot.handler.slice(0,500):previous?.handler ?? null,
      updated:typeof snapshot.updated==='string'?snapshot.updated.slice(0,500):previous?.updated ?? null,
      observedAt:Date.now()});
    if (!value || previous?.title === value.title && previous?.status === value.status &&
        previous?.handler === value.handler && previous?.updated === value.updated) return;
    records.set(key, value);
    try { await api.local.set({[key]:value}); }
    catch (error) {
      // A failed optimistic write must retain fields absent from the next DOM snapshot.
      // An intervening storage event/newer write owns its cache entry.
      if (records.get(key) === value) {
        if (previous) records.set(key, previous); else records.delete(key);
      }
      throw error;
    }
  }
  function url(id) {
    return /^\d+$/.test(id) ? `${ORIGIN}/openItem/moduleId/1003/sequenceId/${id}` : null;
  }
  globalThis.EasitPlusTickets = {PREFIX, keyFor, normalize, remember, ready, url};
}

function initNotes({globalThis, api}) {
  const ICONS=Object.freeze(['📧','📞','‼️','⏳','📋','⭐']);
  const PREFIX='easitPlusNoteV1:';
  const validTime=value=>Number.isSafeInteger(value)&&value>0&&value<=8640000000000000;
  function normalize(value,{strict=false}={}) {
    const legacy=typeof value==='string',text=legacy?value:value?.text,emoji=legacy?'📋':value?.emoji;
    if(typeof text!=='string'||text.length>20000||typeof emoji!=='string'||!emoji.trim()||emoji.length>32) {
      if(strict)throw new Error('Ogiltig anteckning');
      return null;
    }
    if(legacy&&!text.trim())return null;
    const result={text,emoji:ICONS.includes(emoji)?emoji:'📋'};
    if(!legacy&&(value?.followUpAt!==undefined||value?.followUpDismissedAt!==undefined)) {
      if(!validTime(value.followUpAt)||(value.followUpDismissedAt!==undefined&&(!validTime(value.followUpDismissedAt)||value.followUpDismissedAt<value.followUpAt))) {
        if(strict)throw new Error('Ogiltig uppföljning');
        return null;
      }
      result.followUpAt=value.followUpAt;
      if(value.followUpDismissedAt!==undefined)result.followUpDismissedAt=value.followUpDismissedAt;
    }
    return result;
  }
  const isDue=(note,now=Date.now())=>!!note?.followUpAt&&!note.followUpDismissedAt&&note.followUpAt<=now;
  function toLocalTime(at) {
    if(!validTime(at))return '';
    const date=new Date(at),pad=value=>String(value).padStart(2,'0');
    return `${String(date.getFullYear()).padStart(4,'0')}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function fromLocalTime(value) {
    if(!value)return null;
    const at=new Date(value).getTime();
    if(!validTime(at)||toLocalTime(at)!==value)throw new Error('Välj ett giltigt datum och klockslag.');
    return at;
  }
  async function edit(id,action,note,expectedAt) {
    const result=await api.send({type:'easit-plus-note-edit-v1',id,action,note,expectedAt});
    if(!result?.ok)throw new Error(result?.error||'Kunde inte spara anteckningen. Försök igen.');
  }
  globalThis.EasitPlusNotes=Object.freeze({ICONS,PREFIX,normalize,validTime,isDue,toLocalTime,fromLocalTime,
    save:(id,note)=>edit(id,'save',note),remove:id=>edit(id,'remove'),dismiss:(id,expectedAt)=>edit(id,'dismiss',undefined,expectedAt)});
}

/* Shared local date/time controls. Shadow DOM keeps Easit's delegated form events out. */
function initFollowupPicker({document, globalThis}) {
  const pad=value=>String(value).padStart(2,'0');
  const dayValue=date=>`${String(date.getFullYear()).padStart(4,'0')}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const parseDay=value=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const date=new Date(value+'T12:00');
    return Number.isFinite(date.getTime())&&dayValue(date)===value?date:null;
  };
  function create(at) {
    const element=document.createElement('easit-plus-followup-picker');
    element.setAttribute('data-easit-plus-local-ui','');
    const root=element.attachShadow({mode:'open'});
    // Static markup only. Saved dates and labels are assigned as values/text below.
    root.innerHTML=`<style>
      :host{display:block;margin:14px 0;font:inherit;color:var(--easit-plus-ui-text,#253444)}
      *{box-sizing:border-box}[hidden]{display:none!important}
      .legend{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;font-weight:600}.legend span{font-weight:400;color:var(--easit-plus-ui-muted,#64748b)}
      button,input{font:inherit;color:inherit}button{cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}.day:disabled{color:var(--easit-plus-ui-muted,#64748b);background:transparent}
      button:focus-visible,input:focus-visible{outline:2px solid var(--easit-plus-ui-accent,#2d8ab3);outline-offset:2px}
      .clear{margin-left:auto;border:0;padding:2px 0;background:transparent;color:var(--easit-plus-ui-muted,#64748b);font-size:11px}
      .fields{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:10px}
      label{display:block;font-size:11px;color:var(--easit-plus-ui-muted,#64748b);margin-bottom:5px}
      .field{display:flex;align-items:center;min-width:0;background:var(--easit-plus-ui-soft,#f8fafc);border:1px solid var(--easit-plus-ui-control-border,#cbd5e1);border-radius:7px}
      .field:focus-within{border-color:var(--easit-plus-ui-accent,#2d8ab3)}
      .field input{min-width:0;width:100%;height:36px;padding:8px 9px;border:0;border-radius:7px;background:transparent;font-size:12px;font-variant-numeric:tabular-nums;outline-offset:-2px}
      .toggle,.nav{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;padding:0;border:0;border-radius:5px;background:transparent}
      svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
      button:hover:not(:disabled){background:var(--easit-plus-ui-hover,#f1f5f9)}
      .panel{margin-top:8px;padding:10px;border:1px solid var(--easit-plus-ui-border,#e2e8f0);border-radius:8px;background:var(--easit-plus-ui-surface,#fff)}
      .month{display:flex;align-items:center;justify-content:space-between;gap:6px}.month strong{font-size:12px;font-weight:600;text-transform:capitalize}
      .week,.days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.days [role=row]{display:contents}.week{margin-top:8px;color:var(--easit-plus-ui-muted,#64748b);font-size:10px;text-align:center}.week span{padding:4px 0}
      .day{width:100%;min-height:29px;padding:5px 0;border:0;border-radius:5px;background:transparent;font-size:11px;font-variant-numeric:tabular-nums}
      .day.outside{color:var(--easit-plus-ui-muted,#64748b);opacity:.65}.day[aria-current=date]{box-shadow:inset 0 0 0 1px var(--easit-plus-ui-control-border,#cbd5e1)}
      .day[aria-selected=true]{background:var(--easit-plus-ui-selected,#e8f0fe);color:var(--easit-plus-ui-accent-text,#175a9b);font-weight:650}
      .footer{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.footer button{padding:6px 9px;border:0;border-radius:5px;background:var(--easit-plus-ui-soft,#f8fafc);font-size:11px}
    </style>
    <div class="legend">Uppföljning <span>valfri</span><button class="clear" type="button" aria-label="Rensa uppföljning">Rensa</button></div>
    <div class="fields">
      <div><label for="day">Dag</label><div class="field"><input id="day" type="text" placeholder="ÅÅÅÅ-MM-DD" maxlength="10" autocomplete="off" spellcheck="false" aria-controls="calendar" aria-expanded="false"><button type="button" class="toggle" data-open="day" aria-label="Välj dag" aria-controls="calendar" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg></button></div></div>
      <div><label for="time">Tid</label><div class="field"><input id="time" type="text" placeholder="HH:MM" maxlength="5" autocomplete="off" spellcheck="false" pattern="[0-9]{2}:[0-9]{2}"></div></div>
    </div>
    <div class="panel" id="calendar" hidden role="group" aria-label="Välj dag för uppföljning">
      <div class="month"><button type="button" class="nav previous" aria-label="Föregående månad"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><strong aria-live="polite"></strong><button type="button" class="nav next" aria-label="Nästa månad"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div>
      <div class="week" aria-hidden="true"><span>M</span><span>T</span><span>O</span><span>T</span><span>F</span><span>L</span><span>S</span></div><div class="days" role="grid" aria-label="Dagar"></div><div class="footer"><button type="button" class="today">Idag</button></div>
    </div>
    `;
    const day=root.getElementById('day'),time=root.getElementById('time'),calendar=root.getElementById('calendar');
    const clear=root.querySelector('.clear');
    const firstAllowedDay=()=>dayValue(new Date(Math.floor(Date.now()/60000)*60000+60000));
    let originalAt=null,originalLocal='';
    let month=new Date(),focused=dayValue(month),open=null;
    const changed=()=>{clear.hidden=!day.value&&!time.value;day.removeAttribute('aria-invalid');time.removeAttribute('aria-invalid');};
    function close(focus=false) {
      const prior=open;open=null;calendar.hidden=true;
      for(const node of root.querySelectorAll('[aria-expanded]'))node.setAttribute('aria-expanded','false');
      if(focus)(prior==='day'?day:time).focus();
    }
    function renderCalendar(focus=false) {
      root.querySelector('.month strong').textContent=month.toLocaleDateString('sv-SE',{month:'long',year:'numeric'});
      const minimum=firstAllowedDay();
      if(focused<minimum)focused=minimum;
      const previous=root.querySelector('.previous'),atMinimum=dayValue(new Date(month.getFullYear(),month.getMonth(),1,12))<=minimum.slice(0,7)+'-01';
      // Keep keyboard focus on an enabled navigation button.
      if(atMinimum&&root.activeElement===previous)root.querySelector('.next').focus();
      previous.disabled=atMinimum;
      root.querySelector('.today').disabled=dayValue(new Date())<minimum;
      const days=root.querySelector('.days');days.replaceChildren();
      const first=new Date(month.getFullYear(),month.getMonth(),1,12),offset=(first.getDay()+6)%7;
      let row;
      for(let index=0;index<42;index++) {
        if(index%7===0){row=document.createElement('div');row.setAttribute('role','row');days.append(row);}
        const date=new Date(first);date.setDate(1-offset+index);const value=dayValue(date);
        const button=document.createElement('button');button.type='button';button.className='day'+(date.getMonth()!==month.getMonth()?' outside':'');
        button.dataset.day=value;button.textContent=String(date.getDate());button.setAttribute('role','gridcell');
        button.setAttribute('aria-label',date.toLocaleDateString('sv-SE',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
        button.setAttribute('aria-selected',String(day.value===value));if(value===dayValue(new Date()))button.setAttribute('aria-current','date');
        button.disabled=value<minimum;button.tabIndex=!button.disabled&&value===focused?0:-1;row.append(button);
      }
      if(focus)root.querySelector(`[data-day="${focused}"]`)?.focus();
    }
    function show() {
      if(open){close(true);return;}
      open='day';
      day.setAttribute('aria-expanded','true');root.querySelector('[data-open="day"]').setAttribute('aria-expanded','true');
      const minimum=firstAllowedDay();
      month=parseDay(day.value>=minimum?day.value:minimum)||parseDay(minimum);
      focused=dayValue(month);calendar.hidden=false;renderCalendar(true);
    }
    function selectDay(value) {if(value<firstAllowedDay())return;day.value=value;focused=value;month=parseDay(value);changed();renderCalendar(true);}
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.open)show();
      else if(button.dataset.day)selectDay(button.dataset.day);
      else if(button===clear){day.value=time.value='';changed();if(open)renderCalendar();day.focus();}
      else if(button.classList.contains('previous')||button.classList.contains('next')) {month=new Date(month.getFullYear(),month.getMonth()+(button.classList.contains('next')?1:-1),1,12);focused=dayValue(month);renderCalendar();}
      else if(button.classList.contains('today'))selectDay(dayValue(new Date()));
    });
    root.addEventListener('input',event=>{if(event.target===day||event.target===time)changed();});
    root.addEventListener('keydown',event=>{
      const field=event.target;
      if(event.key==='Escape'&&open){event.preventDefault();return;}
      if(field===day&&event.key==='ArrowDown'){event.preventDefault();if(open)renderCalendar(true);else show();return;}
      if(!field.dataset.day||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))return;
      event.preventDefault();const date=parseDay(field.dataset.day);
      if(event.key==='PageUp'||event.key==='PageDown')date.setMonth(date.getMonth()+(event.key==='PageDown'?1:-1),1);
      else date.setDate(date.getDate()+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-(date.getDay()+6)%7,End:6-(date.getDay()+6)%7}[event.key]));
      if(dayValue(date)<firstAllowedDay())date.setTime(parseDay(firstAllowedDay()).getTime());
      focused=dayValue(date);month=date;renderCalendar(true);
    });
    for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup','input','change'])root.addEventListener(type,event=>event.stopPropagation());
    function setValue(value) {const local=globalThis.EasitPlusNotes.toLocalTime(value);originalAt=local?value:null;originalLocal=local;[day.value,time.value]=local?local.split('T'):['',''];changed();close();}
    function value() {
      if(!day.value&&!time.value)return null;
      if(!parseDay(day.value)){day.setAttribute('aria-invalid','true');day.focus();throw new Error('Välj en giltig dag för uppföljningen.');}
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value)){time.setAttribute('aria-invalid','true');time.focus();throw new Error('Välj en giltig tid för uppföljningen.');}
      const local=day.value+'T'+time.value;
      // Keep an existing deadline (and its dismissal) when only the note is edited.
      if(originalAt!==null&&local===originalLocal)return originalAt;
      const at=globalThis.EasitPlusNotes.fromLocalTime(local);
      if(at<=Date.now()){
        const field=day.value<firstAllowedDay()?day:time;
        field.setAttribute('aria-invalid','true');field.focus();
        throw new Error('Välj ett datum och klockslag framåt i tiden.');
      }
      return at;
    }
    setValue(at);return {element,setValue,value,isOpen:()=>open!==null,close};
  }
  globalThis.EasitPlusFollowupPicker={create};
}

/* In-page reminders are shown once per top-level Easit tab, never in editors/frames. */
function initReminders({window, document, globalThis, api, Element, requestAnimationFrame}) {
  if(window!==window.top||globalThis.EasitPlusReminders)return;
  const notes=globalThis.EasitPlusNotes,listeners=new Set(),notices=new Map(),actions=new WeakMap();
  let records=[],data={},timer=null,revision=0,stack=null,queued=false;
  const hasDue=()=>records.some(note=>notes.isDue(note));
  function schedule() {
    clearTimeout(timer);
    const next=records.filter(note=>note.followUpAt>Date.now()&&!note.followUpDismissedAt).map(note=>note.followUpAt);
    if(next.length)timer=setTimeout(update,Math.max(1,Math.min(2147483647,Math.min(...next)-Date.now())));
  }
  function render() {
    queued=false;
    if(!document.documentElement)return;
    const due=records.filter(note=>notes.isDue(note)).sort((a,b)=>a.followUpAt-b.followUpAt||a.id.localeCompare(b.id));
    for(const [id,node]of notices)if(!due.some(note=>note.id===id)){node.remove();notices.delete(id);}
    if(!due.length){stack?.remove();stack=null;return;}
    if(!stack?.isConnected) {
      stack=document.createElement('div');stack.className='easit-plus-reminders';
      stack.setAttribute('data-easit-plus-addon','');stack.setAttribute('data-easit-plus-local-ui','');
      globalThis.EasitPlusFeedback.mountNotice(stack);
    }
    for(const note of due) {
      let notice=notices.get(note.id);
      if(!notice) {
        notice=document.createElement('section');notice.className='easit-plus-reminder';notice.dataset.ticketId=note.id;
        notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
        const head=document.createElement('div');head.className='easit-plus-reminder-head';
        const title=document.createElement('strong');title.textContent='Uppföljning';
        const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='easit-plus-reminder-dismiss';dismiss.title='Avfärda uppföljning';
        head.append(title,dismiss);
        const link=document.createElement('a');link.className='easit-plus-reminder-link';link.target='_blank';link.rel='noopener noreferrer';
        const time=document.createElement('time');
        const text=document.createElement('p');text.className='easit-plus-reminder-text';
        const error=document.createElement('p');error.className='easit-plus-reminder-error';error.setAttribute('role','alert');
        notice.append(head,link,time,text,error);notices.set(note.id,notice);stack.append(notice);
      }
      const [head,link,time,text,error]=notice.children,dismiss=head.querySelector('button');
      const metadata=globalThis.EasitPlusTickets?.normalize(data['easitPlusTicketV1:'+encodeURIComponent(note.id)]);
      const label='#'+note.id+(metadata?.id===note.id&&metadata.title?' · '+metadata.title:'');
      if(link.textContent!==label)link.textContent=label;
      const url=globalThis.EasitPlusTickets?.url(note.id);
      if(url)link.href=url;else link.removeAttribute('href');
      const when=new Date(note.followUpAt).toLocaleString('sv-SE',{dateStyle:'short',timeStyle:'short'});
      if(time.textContent!==when){time.textContent=when;time.dateTime=new Date(note.followUpAt).toISOString();}
      if(text.textContent!==note.text)text.textContent=note.text;
      text.hidden=!note.text.trim();
      dismiss.setAttribute('aria-label','Avfärda uppföljning för ärende '+note.id);
      actions.set(dismiss,async()=>{
        dismiss.disabled=true;error.textContent='';
        try {await notes.dismiss(note.id,note.followUpAt);await refresh();}
        catch {error.textContent='Kunde inte avfärda. Försök igen.';dismiss.disabled=false;}
      });
    }
  }
  function update() {
    schedule();listeners.forEach(fn=>fn());
    if(!queued){queued=true;requestAnimationFrame(render);}
  }
  async function refresh() {
    const request=++revision;
    try {
      const result=await api.local.get(null);if(request!==revision)return;
      data=result;records=[];
      for(const [key,value]of Object.entries(result)) {
        if(!key.startsWith(notes.PREFIX))continue;
        const note=notes.normalize(value);if(!note?.followUpAt)continue;
        try {const id=decodeURIComponent(key.slice(notes.PREFIX.length));if(id&&id.length<=1000)records.push({...note,id});}catch{}
      }
      update();
    } catch { /* Existing notices remain available after a transient read failure. */ }
  }
  // Only this module's controls are isolated; never intercept another local UI.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup','input','change'])window.addEventListener(type,event=>{
    if(!(event.target instanceof Element)||!event.target.closest('.easit-plus-reminders'))return;
    event.stopImmediatePropagation();
    if(type==='click')actions.get(event.target.closest('button'))?.();
  },true);
  api.changes.addListener((changes,area)=>{
    if(area==='local'&&Object.keys(changes).some(key=>key.startsWith(notes.PREFIX)||key.startsWith('easitPlusTicketV1:')))refresh();
  });
  window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);
  document.addEventListener('DOMContentLoaded',update,{once:true});
  globalThis.EasitPlusReminders={hasDue,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  refresh();
}

function initListData({globalThis, getComputedStyle}) {
  function text(cell) {
    if(!cell)return '';
    const labels=[...cell.querySelectorAll('.easit-showlabel')].filter(node=>{
      const style=getComputedStyle(node);return style.display!=='none'&&style.visibility!=='hidden';
    });
    if(labels.length)return labels.map(node=>node.textContent).join(' ').replace(/\s+/g,' ').trim();
    const clone=cell.cloneNode(true);
    clone.querySelectorAll('.easit-plus-followup, .easit-plus-unread, [data-easit-plus-addon]').forEach(node=>node.remove());
    return clone.textContent.replace(/\s+/g,' ').trim();
  }
  function columns(list) {
    const headers=[...list.querySelectorAll('.z-listheader')].filter(node=>node.closest('.z-listbox')===list);
    const names=headers.map(node=>text(node).toLocaleUpperCase('sv'));
    return {headers,index:name=>names.indexOf(name),handler:names.findIndex(name=>['HANDLÄGGARE','ANSVARIG HANDLÄGGARE'].includes(name))};
  }
  function unread(row) {
    return [...row.querySelectorAll('.color-rule-marker[title]')].some(marker=>{
      if(marker.title.trim().toLocaleLowerCase('sv')!=='oläst e-post')return false;
      for(let node=marker;node&&node!==row;node=node.parentElement) {
        const style=getComputedStyle(node);
        if(node.hidden||style.display==='none'||style.visibility==='hidden')return false;
      }
      return true;
    });
  }
  globalThis.EasitPlusListData=Object.freeze({text,columns,unread});
}

function initFollowup({window, document, globalThis, api, Element}) {
  const {ICONS,normalize:normalizeNote}=globalThis.EasitPlusNotes;
  const {text,unread:hasUnread,columns}=globalThis.EasitPlusListData;
  const PIN='easitPlusPinV1:', NOTE='easitPlusNoteV1:';
  const records=new Map(), listeners=new Set(), queues=new Map(), touched=new Set();
  const localActions=new WeakMap();
  const keyFor=(id,prefix)=>prefix+encodeURIComponent(id);
  const emit=()=>listeners.forEach(fn=>fn());
  function valid(key,value) {
    if(key.startsWith(PIN)) return value===true?true:null;
    if(key.startsWith(NOTE)) return normalizeNote(value);
    return null;
  }
  function readRow(row, mapping) {
    const list = row?.closest('.z-listbox');
    if (!list || !globalThis.EasitPlusScope?.isMainList(list) || !row.matches('tr.z-listitem')) return null;
    const {headers,index,handler:handlerIndex}=mapping||columns(list);
    if(headers.length!==row.cells.length) return null;
    const idIndex=index('ID'), statusIndex=index('STATUS'), updatedIndex=index('UPPDATERAD');
    if(idIndex<0) return null;
    const id=text(row.cells[idIndex]), updated=updatedIndex<0?undefined:text(row.cells[updatedIndex]);
    if(!id) return null;
    return {id,updated,handler:handlerIndex<0?undefined:text(row.cells[handlerIndex]),title:text(row.cells[index('RUBRIK')]),status:text(row.cells[statusIndex]),unread:hasUnread(row),cell:row.cells[statusIndex],titleCell:row.cells[index('RUBRIK')],indicatorCell:row.cells[0],row};
  }
  api.changes.addListener((changes,area)=>{
    if(area!=='local') return;
    let changed=false;
    for(const [key,change] of Object.entries(changes)) {
      if(![PIN,NOTE].some(prefix=>key.startsWith(prefix))) continue;
      touched.add(key);const value=valid(key,change.newValue);
      if(value!==null) records.set(key,value);else records.delete(key);
      changed=true;
    }
    if(changed) emit();
  });
  const ready=api.local.get(null).then(values=>{
    for(const [key,value] of Object.entries(values)) {
      if(touched.has(key)) continue;
      const record=valid(key,value);if(record!==null) records.set(key,record);
    }
    emit();
  });
  function serialize(key,fn) {
    const task=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);
    queues.set(key,task);
    task.finally(()=>{if(queues.get(key)===task) queues.delete(key);}).catch(()=>{});
    return task;
  }
  async function pin(id,snapshot) {
    await ready;const key=keyFor(id,PIN);
    return serialize(key,async()=>{
      const latest=await api.local.get(key);
      if(latest[key]===true) await api.local.remove(key);
      else {
        await api.local.set({[key]:true});
        await globalThis.EasitPlusTickets?.remember(snapshot);
      }
    });
  }
  async function saveNote(id,value,emoji='📋',snapshot,followUpAt=null) {
    if(typeof value!=='string' || value.length>20000 || !ICONS.includes(emoji)) throw new Error('Ogiltig anteckning');
    await ready;const key=keyFor(id,NOTE);
    return serialize(key,async()=>{
      await globalThis.EasitPlusNotes.save(id,{text:value,emoji,...(followUpAt===null?{}:{followUpAt})});
      await globalThis.EasitPlusTickets?.remember(snapshot);
    });
  }
  async function removeNote(id) {
    await ready;const key=keyFor(id,NOTE);
    return serialize(key,()=>globalThis.EasitPlusNotes.remove(id));
  }
  const getNoteData=id=>records.get(keyFor(id,NOTE))||null;
  const getNote=id=>getNoteData(id)?.text||'';
  function editNote(snapshot) {
    hidePreview();
    document.querySelector('[data-easit-plus-editor]')?.remove();
    const priorFocus=document.activeElement;
    const dialog=document.createElement('dialog');dialog.className='easit-plus-editor';
    dialog.setAttribute('data-easit-plus-editor','');dialog.setAttribute('data-easit-plus-local-ui','');
    dialog.setAttribute('aria-label','Redigera lokal anteckning');
    const form=document.createElement('form');
    const title=document.createElement('h2');title.textContent=`Anteckning · ${snapshot.id}`;
    const label=document.createElement('label');label.textContent='Anteckning (valfri)';
    const input=document.createElement('textarea');input.rows=8;input.maxLength=20000;input.value=getNote(snapshot.id);label.append(input);
    const emojiLabel=document.createElement('div');emojiLabel.textContent='Ikon';
    let selectedIcon=getNoteData(snapshot.id)?.emoji||'📋';
    const choices=document.createElement('div');choices.className='easit-plus-emoji-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Ikon');
    const refresh=()=>choices.querySelectorAll('button').forEach(node=>node.setAttribute('aria-pressed',String(node.textContent===selectedIcon)));
    for(const emoji of ICONS) {
      const button=document.createElement('button');button.type='button';button.textContent=emoji;button.setAttribute('aria-label',`Välj ${emoji}`);
      localActions.set(button,()=>{selectedIcon=emoji;refresh();});choices.append(button);
    }
    refresh();
    const followPicker=globalThis.EasitPlusFollowupPicker.create(getNoteData(snapshot.id)?.followUpAt);
    const error=document.createElement('p');error.setAttribute('role','status');
    const buttons=document.createElement('div');
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Avbryt';
    const save=document.createElement('button');save.type='submit';save.textContent='Spara';
    const remove=document.createElement('button');remove.type='button';remove.textContent='Ta bort';remove.disabled=!getNoteData(snapshot.id);
    buttons.append(cancel,remove,save);form.append(title,emojiLabel,choices,label,followPicker.element,error,buttons);dialog.append(form);document.body.append(dialog);
    const close=()=>{dialog.remove();if(priorFocus?.isConnected) priorFocus.focus({preventScroll:true});};
    localActions.set(remove,async()=>{
      remove.disabled=true;save.disabled=true;
      try {await removeNote(snapshot.id);close();}
      catch {error.textContent='Kunde inte ta bort anteckningen. Försök igen.';remove.disabled=false;save.disabled=false;}
    });
    localActions.set(cancel,close);dialog.addEventListener('cancel',event=>{event.preventDefault();if(!followPicker.isOpen())close();});
    form.addEventListener('submit',async event=>{
      event.preventDefault();event.stopPropagation();save.disabled=true;
      try {await saveNote(snapshot.id,input.value,selectedIcon,snapshot,followPicker.value());close();}
      catch (err) {error.textContent=err.message||'Kunde inte spara anteckningen. Försök igen.';save.disabled=false;}
    });
    if(dialog.showModal) dialog.showModal();else dialog.setAttribute('open','');
    input.focus();
  }
  let preview=null, previewAnchor=null;
  function hidePreview() {
    previewAnchor?.removeAttribute('aria-describedby');preview?.remove();preview=null;previewAnchor=null;
  }
  function showPreview(anchor,id) {
    hidePreview();
    const note=getNoteData(id);if(!note?.text.trim())return;
    preview=document.createElement('div');preview.className='easit-plus-note-preview';preview.id='easit-plus-note-preview';
    preview.setAttribute('role','tooltip');preview.setAttribute('data-easit-plus-addon','');
    const text=document.createElement('div');text.textContent=note.text;
    const hint=document.createElement('small');hint.textContent='Klicka för att redigera';preview.append(text,hint);document.body.append(preview);
    previewAnchor=anchor;anchor.setAttribute('aria-describedby',preview.id);
    const rect=anchor.getBoundingClientRect(), box=preview.getBoundingClientRect();
    preview.style.left=`${Math.max(8,Math.min(rect.left,innerWidth-box.width-8))}px`;
    preview.style.top=`${rect.bottom+box.height+8<innerHeight?rect.bottom+6:Math.max(8,rect.top-box.height-6)}px`;
  }
  window.addEventListener('scroll',hidePreview,true);window.addEventListener('resize',hidePreview);
  function renderRows(rows,enabled,targetList,mapping) {
    const list=targetList||rows[0]?.closest('.z-listbox');
    if(!mapping&&list)mapping=columns(list);
    if(list) list.querySelectorAll('[data-easit-plus-indicator-column]').forEach(node=>node.removeAttribute('data-easit-plus-indicator-column'));
    let widened=false;
    for(const row of rows) {
      row.querySelectorAll('.easit-plus-followup, .easit-plus-note').forEach(node=>node.remove());
      const snapshot=readRow(row,mapping);
      if(!snapshot) {
        row.removeAttribute('data-easit-plus-pinned');row.querySelectorAll('[data-easit-plus-addon]').forEach(node=>node.remove());continue;
      }
      const pinned=records.get(keyFor(snapshot.id,PIN))===true;
      row.toggleAttribute('data-easit-plus-pinned',pinned);
      const note=getNoteData(snapshot.id);
      if(pinned || note)globalThis.EasitPlusTickets?.remember(snapshot).catch(()=>{});
      row.querySelectorAll('.easit-plus-contact').forEach(node=>node.remove());
      let bar=row.querySelector('.easit-plus-indicators');
      if(!pinned && !note) {if(bar?.contains(previewAnchor))hidePreview();bar?.remove();continue;}
      widened=true;
      if(!bar) {
        bar=document.createElement('span');bar.className='easit-plus-indicators';
        for(const attr of ['data-easit-plus-addon','data-easit-plus-local-ui'])bar.setAttribute(attr,'');
        (snapshot.indicatorCell.querySelector('.z-listcell-content')||snapshot.indicatorCell).append(bar);
      }
      let pinIcon=bar.querySelector('.easit-plus-pin');
      if(!pinned)pinIcon?.remove();
      else {
        if(!pinIcon) {
          pinIcon=document.createElement('button');pinIcon.type='button';pinIcon.className='easit-plus-pin';
          pinIcon.textContent='📌';
          pinIcon.title='Lossa ärende';pinIcon.setAttribute('aria-label','Lossa fäst ärende');

        }
        localActions.set(pinIcon,()=>pin(snapshot.id,snapshot).catch(()=>{}));
        if(bar.firstElementChild!==pinIcon)bar.prepend(pinIcon);
      }
      let noteIcon=bar.querySelector('.easit-plus-note-icon');
      if(!note) {if(noteIcon===previewAnchor)hidePreview();noteIcon?.remove();}
      else {
        if(!noteIcon) {
          noteIcon=document.createElement('button');noteIcon.type='button';noteIcon.className='easit-plus-note-icon';
          noteIcon.setAttribute('aria-label',`Redigera lokal anteckning för ärende ${snapshot.id}`);
          noteIcon.addEventListener('mouseenter',()=>showPreview(noteIcon,noteIcon.dataset.ticketId));
          noteIcon.addEventListener('mouseleave',hidePreview);
          noteIcon.addEventListener('focus',()=>showPreview(noteIcon,noteIcon.dataset.ticketId));noteIcon.addEventListener('blur',hidePreview);
          bar.append(noteIcon);
        }
        noteIcon.dataset.ticketId=snapshot.id;
        localActions.set(noteIcon,()=>editNote(snapshot));
        if(noteIcon.textContent!==note.emoji)noteIcon.textContent=note.emoji;
        if(previewAnchor===noteIcon) {
          if(!note.text.trim())hidePreview();
          else if(preview?.firstElementChild.textContent!==note.text)preview.firstElementChild.textContent=note.text;
        }
      }
    }
    if(list && widened) {
      for(const row of rows)row.cells[0]?.setAttribute('data-easit-plus-indicator-column','');
      const header=[...list.querySelectorAll('.z-listheader')].find(node=>node.closest('.z-listbox')===list);
      header?.setAttribute('data-easit-plus-indicator-column','');
      list.querySelectorAll('colgroup').forEach(group=>{if(group.closest('.z-listbox')===list)group.firstElementChild?.setAttribute('data-easit-plus-indicator-column','');});
    }
  }

  // Isolera våra anteckningskontroller från Easits klick/kommandon.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup','input','change']) {
    window.addEventListener(type,event=>{
      const own=event.target instanceof Element && event.target.closest('[data-easit-plus-local-ui]');
      // The local-ui marker is shared with the template picker and other modules.
      // Only note/pin controls belong to this handler; each other UI owns its events.
      if(!own || !own.matches('.easit-plus-indicators, [data-easit-plus-editor]')) return;
      if(type==='contextmenu' && own.matches('.easit-plus-indicators'))return;
      event.stopImmediatePropagation();
      if(type==='click') localActions.get(event.target.closest('button'))?.();

    },true);
  }
  globalThis.EasitPlusFollowup={ready,readRow,text,hasUnread,renderRows,pin,editNote,saveNote,removeNote,
    getPinned:id=>records.get(keyFor(id,PIN))===true,getNote,hasNote:id=>Boolean(getNoteData(id)),
    subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
}

function initAssigneePicker({window, document, globalThis, Element, Event, getComputedStyle}) {
  if(globalThis.EasitPlusAssigneePicker)return;
  const OWN='[data-easit-plus-assignee-ui]';
  const states=new WeakMap();
  let opened=null,nextId=0;
  const mark=node=>{node.setAttribute('data-easit-plus-assignee-ui','');node.setAttribute('data-easit-plus-local-ui','');return node;};
  function close(focus=false) {
    const state=opened;if(!state)return;
    opened=null;closeMenu(state);
    if(state.popup.hidePopover){try{state.popup.hidePopover();}catch{ /* Already closed by the page. */ }}
    state.popup.hidden=true;state.button.setAttribute('aria-expanded','false');
    if(focus&&state.button.isConnected)state.button.focus({preventScroll:true});
  }
  function closeMenu(state,focus=false) {
    const menu=state.menu;if(!menu)return;
    state.menu=null;menu.node.remove();
    if(focus&&opened===state){
      const row=state.popup.querySelector(`[data-easit-assignee-index="${menu.index}"]`);
      if(row&&!row.closest('[hidden]'))row.focus({preventScroll:true});else focusOption(state,0);
    }
  }
  function menuOption(state,index) {
    const option=state.select.options[index],expected=state.renderedOptions?.get(index);
    return state.config.isActive()&&state.select.isConnected&&!state.select.disabled&&state.select.getAttribute('aria-disabled')!=='true'&&option&&!option.hidden&&
      expected?.node===option&&expected.value===option.value&&expected.label===name(option)&&name(option).trim()?option:null;
  }
  function refreshMenu(state) {
    const menu=state.menu;if(!menu)return;
    const option=menuOption(state,menu.index);
    if(option!==menu.option){closeMenu(state);return;}
    menu.action.textContent=state.config.isExcluded(name(option))?'Ta bort exkludering':'Exkludera';
    menu.action.setAttribute('aria-label',menu.action.textContent+': '+name(option));
    menu.today.hidden=state.config.isExcluded(name(option));
    menu.today.setAttribute('aria-label','Exkludera resten av dagen: '+name(option));
  }
  function openMenu(state,index,event) {
    closeMenu(state);
    const option=menuOption(state,index);if(!option||!state.config.setExcluded)return;
    const node=mark(document.createElement('div'));node.className='easit-plus-assignee-menu';node.setAttribute('role','menu');node.setAttribute('aria-label',name(option));
    node.setAttribute('popover','manual');if(typeof node.showPopover!=='function')node.removeAttribute('popover');
    const action=document.createElement('button');action.type='button';action.setAttribute('role','menuitem');
    const today=document.createElement('button');today.type='button';today.setAttribute('role','menuitem');today.textContent='Exkludera resten av dagen';today.dataset.easitExcludeToday='';node.append(action,today);
    node._easitAssignee=state;state.menu={node,action,today,index,option};refreshMenu(state);
    for(const property of ['font-family','font-size','font-weight','font-style','line-height','letter-spacing']){
      const value=state.popup.style.getPropertyValue(property);if(value)node.style.setProperty(property,value,'important');
    }
    state.popup.parentElement.append(node);node.showPopover?.();
    const row=state.popup.querySelector(`[data-easit-assignee-index="${index}"]`),box=row.getBoundingClientRect();
    const keyboard=event.type==='keydown'||!event.clientX&&!event.clientY;
    const x=keyboard?box.left:event.clientX,y=keyboard?box.bottom:event.clientY;
    const rect=node.getBoundingClientRect();
    node.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';node.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';
    action.focus({preventScroll:true});
  }
  async function toggleExclusion(state,today=false) {
    const menu=state.menu;if(!menu||menu.action.disabled)return;
    if(menuOption(state,menu.index)!==menu.option){closeMenu(state,true);return;}
    menu.action.disabled=menu.today.disabled=true;
    try {
      if(today)await state.config.excludeToday(name(menu.option));
      else await state.config.setExcluded(name(menu.option),!state.config.isExcluded(name(menu.option)));
      if(state.menu===menu){update(state.select,state.config);closeMenu(state,true);if(opened===state)position(state);}
    } catch {
      if(state.menu!==menu)return;
      menu.action.disabled=menu.today.disabled=false;
      let error=menu.node.querySelector('[role="alert"]');if(!error){error=document.createElement('div');error.setAttribute('role','alert');menu.node.append(error);}
      error.textContent='Kunde inte spara exkluderingen.';menu.action.focus({preventScroll:true});
    }
  }
  function position(state) {
    const box=state.button.getBoundingClientRect();
    const height=Math.min(340,innerHeight-24);
    state.popup.style.width=Math.max(160,Math.min(box.width,innerWidth-24))+'px';
    state.popup.style.maxHeight=height+'px';
    state.popup.style.left=Math.max(12,Math.min(box.left,innerWidth-Math.max(160,box.width)-12))+'px';
    state.popup.style.top=(innerHeight-box.bottom>=Math.min(180,height)?box.bottom:Math.max(12,box.top-Math.min(state.popup.scrollHeight,height)))+'px';
  }
  function name(option){return option.label||option.textContent;}
  function present(option,config,recommendation) {
    const raw=name(option),count=config.countFor(raw);
    return {name:raw,count:count?.total>0?`${count.total}(${count.waiting})`:'',excluded:!!raw.trim()&&config.isExcluded(raw),recommended:recommendation?.option===option,active:recommendation?.option===option?recommendation.active:null};
  }
  function label(node,item) {
    node.replaceChildren();
    const text=document.createElement('span');text.className='easit-plus-assignee-name';text.textContent=item.name;node.append(text);
    if(item.recommended){
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('class','easit-plus-assignee-recommendation');
      icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','14');icon.setAttribute('height','14');icon.setAttribute('fill','currentColor');icon.setAttribute('aria-hidden','true');
      const title=document.createElementNS(icon.namespaceURI,'title');title.textContent=`Rekommenderad · ${item.active} aktiva ärenden`;
      const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('d','m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z');
      icon.append(title,path);node.append(' ',icon);
    }
    if(item.count){const count=document.createElement('span');count.className='easit-plus-assignee-count';count.textContent=item.count;node.append(' ',count);}
    node.classList.toggle('easit-plus-assignee-excluded',item.excluded);
  }
  function visibleOptions(state) {return [...state.popup.querySelectorAll('[role="option"], .easit-plus-assignee-excluded-toggle')].filter(node=>!node.disabled&&!node.closest('[hidden]'));}
  function focusOption(state,index) {
    const options=visibleOptions(state);const target=options[Math.max(0,Math.min(index,options.length-1))];
    target?.focus({preventScroll:true});target?.scrollIntoView?.({block:'nearest'});
  }
  function choose(state,index) {
    const select=state.select;
    if(!state.config.isActive()){remove(select);return;}
    if(!select.isConnected||select.disabled||select.options[index]?.disabled||select.options[index]?.hidden)return;
    const expected=state.renderedOptions?.get(index),option=select.options[index];
    if(!expected||expected.node!==option||expected.value!==option.value||expected.label!==name(option)){renderPopup(state);return;}
    // Only a deliberate choice updates Easit's original control. Never edit
    // native option text, label, value, disabled, hidden, or option ordering.
    const changed=select.selectedIndex!==index;
    select.selectedIndex=index;
    close(true);update(select,state.config);
    if(changed){
      try{state.config.onChoose?.(index);}catch{ /* Recommendation state must never block Easit's normal choice. */ }
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  function renderPopup(state) {
    const active=document.activeElement?.dataset.easitAssigneeIndex;
    state.popup.replaceChildren();
    state.renderedOptions=new Map();
    const ordinary=document.createElement('div');ordinary.setAttribute('role','listbox');ordinary.setAttribute('aria-label','Handläggare');
    const excluded=document.createElement('div');excluded.setAttribute('role','listbox');excluded.setAttribute('aria-label','Exkluderade handläggare');excluded.className='easit-plus-assignee-excluded-list';
    let excludedCount=0;
    for(const [index,option] of [...state.select.options].entries()) {
      if(option.hidden)continue;
      const item=present(option,state.config,state.recommendation);
      state.renderedOptions.set(index,{node:option,value:option.value,label:name(option)});
      const button=document.createElement('div');button.className='easit-plus-assignee-option';button.tabIndex=-1;
      button.setAttribute('role','option');button.setAttribute('aria-selected',String(state.select.selectedIndex===index));
      button.setAttribute('aria-label',`${item.name||'Ingen handläggare'}${item.count?' '+item.count:''}${item.recommended?`, rekommenderad, ${item.active} aktiva ärenden`:''}`);
      button.dataset.easitAssigneeIndex=String(index);button.disabled=option.disabled;button.setAttribute('aria-disabled',String(option.disabled));
      label(button,item);
      (item.excluded?excluded:ordinary).append(button);if(item.excluded)excludedCount++;
    }
    state.popup.append(ordinary);
    if(excludedCount) {
      const group=document.createElement('details');group.open=state.excludedOpen;
      const toggle=document.createElement('summary');toggle.className='easit-plus-assignee-excluded-toggle';toggle.tabIndex=-1;
      toggle.textContent=`Exkluderade (${excludedCount})`;toggle.setAttribute('aria-expanded',String(state.excludedOpen));
      excluded.id=state.popup.id+'-excluded';toggle.setAttribute('aria-controls',excluded.id);excluded.hidden=!state.excludedOpen;
      group.append(toggle,excluded);state.popup.append(group);
    }
    if(active!==undefined)state.popup.querySelector(`[data-easit-assignee-index="${active}"]`)?.focus({preventScroll:true});
  }
  function open(state,last=false) {
    if(!state.config.isActive()){remove(state.select);return;}
    if(state.button.disabled)return;
    update(state.select,state.config);
    close();opened=state;
    state.excludedOpen=false;
    renderPopup(state);state.popup.hidden=false;state.button.setAttribute('aria-expanded','true');
    const host=state.button.closest('dialog[open]')||document.body;if(state.popup.parentElement!==host)host.append(state.popup);
    state.popup.showPopover?.();position(state);
    const options=visibleOptions(state),selected=options.findIndex(node=>node.getAttribute('aria-selected')==='true');
    focusOption(state,selected>=0?selected:last?options.length-1:0);
  }
  function create(select) {
    const button=mark(document.createElement('button'));button.type='button';button.className='easit-plus-assignee-control';
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
    const popup=mark(document.createElement('div'));popup.className='easit-plus-assignee-popup';popup.hidden=true;
    popup.setAttribute('popover','manual');popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Välj handläggare');popup.id='easit-plus-assignees-'+(++nextId);
    if(typeof popup.showPopover!=='function')popup.removeAttribute('popover');
    button.setAttribute('aria-controls',popup.id);
    const state={select,button,popup,tabindex:select.getAttribute('tabindex'),ariaHidden:select.getAttribute('aria-hidden'),signature:null,excludedOpen:false};
    button._easitAssignee=state;popup._easitAssignee=state;
    state.focus=()=>button.focus({preventScroll:true});select.addEventListener('focus',state.focus);
    select.after(button);document.body.append(popup);
    select.setAttribute('data-easit-plus-assignee-native','');select.setAttribute('tabindex','-1');select.setAttribute('aria-hidden','true');
    states.set(select,state);return state;
  }
  function syncNativeStyle(state) {
    const select=state.select;
    // Measure the original select without our visual clipping rule. Never
    // inherit font from its generic container or the portaled popup's body.
    select.removeAttribute('data-easit-plus-assignee-native');
    try {
      const css=getComputedStyle(select);
      // Keep the open list on the same live palette as Easit's native select.
      // theme.js leaves these already-computed colors untouched.
      for(const [property,source] of [['--easit-plus-native-select-background','background-color'],['--easit-plus-native-select-text','color']]) {
        state.popup.style.setProperty(property,css.getPropertyValue(source));
      }
      for(const property of ['font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-transform','direction']) {
        const value=css.getPropertyValue(property);if(value){state.button.style.setProperty(property,value,'important');state.popup.style.setProperty(property,value,'important');}
      }
      // Reuse Easit's SVG arrow and the padding reserved for that background.
      for(const property of ['color','background-color','border-top-width','border-right-width','border-bottom-width','border-left-width','border-top-style','border-right-style','border-bottom-style','border-left-style','border-top-color','border-right-color','border-bottom-color','border-left-color','border-radius','appearance','box-sizing','background-image','background-position','background-size','background-repeat','background-origin','background-clip','padding-top','padding-right','padding-bottom','padding-left','min-height']) {
        const value=css.getPropertyValue(property);if(value)state.button.style.setProperty(property,value,'important');
      }
      const shadow=css.getPropertyValue('box-shadow');if(shadow)state.button.style.setProperty('box-shadow',shadow,'important');
      const height=css.getPropertyValue('height');
      if(parseFloat(height)>0)state.button.style.setProperty('height',height,'important');else state.button.style.removeProperty('height');
    } finally {select.setAttribute('data-easit-plus-assignee-native','');}
  }
  function update(select,config) {
    const state=states.get(select)||create(select);state.config=config;
    if(!state.button.isConnected)select.after(state.button);
    const tabindex=select.getAttribute('tabindex');if(tabindex!=='-1'){state.tabindex=tabindex;select.setAttribute('tabindex','-1');}
    state.button.tabIndex=state.tabindex===null?0:Number(state.tabindex);
    state.button.disabled=select.disabled||select.getAttribute('aria-disabled')==='true';
    syncNativeStyle(state);refreshMenu(state);
    state.recommendation=config.recommendation?.();
    const items=[...select.options].map(option=>({...present(option,config,state.recommendation),disabled:option.disabled,hidden:option.hidden,value:option.value}));
    const signature=JSON.stringify([items,select.selectedIndex,state.button.disabled]);
    if(state.signature===signature)return;
    state.signature=signature;
    const selected=select.options[select.selectedIndex],item=selected?present(selected,config,state.recommendation):{name:'',count:'',excluded:false};
    // Only names belong in the closed field; counts and recommendation icons stay in the list.
    label(state.button,{name:item.name,excluded:false,count:'',recommended:false});
    state.button.setAttribute('aria-label','Handläggare'+(item.name?': '+item.name:''));
    if(opened===state){if(state.button.disabled)close();else{renderPopup(state);position(state);}}
  }
  function remove(select) {
    const state=states.get(select);if(!state)return;
    if(opened===state)close();
    const focused=document.activeElement===state.button;
    state.button.remove();state.popup.remove();select.removeAttribute('data-easit-plus-assignee-native');
    select.removeEventListener('focus',state.focus);
    if(select.getAttribute('tabindex')==='-1'){if(state.tabindex===null)select.removeAttribute('tabindex');else select.setAttribute('tabindex',state.tabindex);}
    if(select.getAttribute('aria-hidden')==='true'){if(state.ariaHidden===null)select.removeAttribute('aria-hidden');else select.setAttribute('aria-hidden',state.ariaHidden);}
    states.delete(select);if(focused&&select.isConnected)select.focus({preventScroll:true});
  }
  // Stop only this visual control's events. The original select's change event
  // is left to Easit, with its untouched option labels and values.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup'])window.addEventListener(type,event=>{
    const own=event.target instanceof Element?event.target.closest(OWN):null;
    if(!own){if(type==='pointerdown')close();return;}
    const state=own._easitAssignee;if(!state)return;
    event.stopImmediatePropagation();
    if(type==='pointerdown'&&state.menu&&own!==state.menu.node)closeMenu(state);
    if(type==='contextmenu') {
      event.preventDefault();
      const row=event.target.closest('[data-easit-assignee-index]');
      if(row&&opened===state)openMenu(state,Number(row.dataset.easitAssigneeIndex),event);
      return;
    }
    if(type==='keydown'&&own===state.menu?.node) {
      if(event.key==='Escape'){event.preventDefault();closeMenu(state,true);}
      else if(event.key==='Tab')close(true);
      else if(['Enter',' '].includes(event.key)){event.preventDefault();document.activeElement?.click();}
      else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();const items=[state.menu.action,state.menu.today].filter(item=>!item.hidden&&!item.disabled),index=items.indexOf(document.activeElement);
        const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next]?.focus();
      }
      return;
    }
    if(type==='click') {
      event.preventDefault();
      if(!state.config.isActive()){remove(state.select);return;}
      if(own===state.menu?.node){const action=event.target.closest('[role="menuitem"]');if(action&&!action.hidden)toggleExclusion(state,action===state.menu.today);return;}
      if(own===state.button){if(opened===state)close();else open(state);}
      else {
        const option=event.target.closest('[data-easit-assignee-index]');
        if(option)choose(state,Number(option.dataset.easitAssigneeIndex));
        else if(event.target.closest('.easit-plus-assignee-excluded-toggle')){state.excludedOpen=!state.excludedOpen;renderPopup(state);state.popup.querySelector('.easit-plus-assignee-excluded-toggle')?.focus();position(state);}
      }
    }
    if(type==='keydown') {
      const row=event.target.closest('[data-easit-assignee-index]');
      if(row&&(event.key==='ContextMenu'||event.key==='F10'&&event.shiftKey)){event.preventDefault();openMenu(state,Number(row.dataset.easitAssigneeIndex),event);return;}
      if(event.key==='Escape'){event.preventDefault();close(true);return;}
      if(event.key==='Tab'){close(true);return;}
      if(own===state.button&&['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();open(state,event.key==='ArrowUp');return;}
      if(opened===state&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault();const options=visibleOptions(state),index=options.indexOf(document.activeElement);
        focusOption(state,event.key==='Home'?0:event.key==='End'?options.length-1:Math.max(0,index+(event.key==='ArrowDown'?1:-1)));
      }
      if(opened===state&&['Enter',' '].includes(event.key)) {event.preventDefault();document.activeElement?.click();}
      if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key!==' ') {
        event.preventDefault();if(opened!==state)open(state);
        state.search=Date.now()-(state.searchAt||0)<700?(state.search||'')+event.key:event.key;state.searchAt=Date.now();
        const options=visibleOptions(state);const index=options.findIndex(node=>node.textContent.trim().toLocaleLowerCase('sv').startsWith(state.search.toLocaleLowerCase('sv')));if(index>=0)focusOption(state,index);
      }
    }
  },true);
  window.addEventListener('resize',()=>{if(opened){closeMenu(opened,true);position(opened);}});
  window.addEventListener('scroll',event=>{if(opened&&!opened.popup.contains(event.target))close();},true);
  globalThis.EasitPlusAssigneePicker={update,remove,close};
}

function initFirstline({window, document, globalThis, api, Element, MutationObserver, getComputedStyle, requestAnimationFrame}) {
  if (globalThis.EasitPlusFirstLine) return;
  const CACHE='easitPlusFirstLineWorkloadV1', EXCLUDED='easitPlusFirstLineExcludedV1';
  const DAILY='easitPlusFirstLineExcludedTodayV1';
  const GROUP='[testid="component-Handläggargrupp"]';
  const HANDLER='[testid="component-Handläggare"]';
  const VIEW='[testid="ivw-view-path"]';
  const DASHBOARD_VIEW='select[testid="ivm-item-view-listbox"]';
  const FIELDS=GROUP+', '+HANDLER+', .eFormFieldContainer';
  const tidy=value=>String(value??'').normalize('NFC').replace(/\s+/g,' ').trim();
  const key=value=>tidy(value).toLocaleLowerCase('sv');
  const collator=new Intl.Collator('sv',{sensitivity:'base'});
  const listeners=new Set(), touched=new Set(), decorated=new Set(), readLabels=new Map();
  const recommendations=new WeakMap();
  const enabled=()=>globalThis.EasitPlusSettings?.get().firstLineWorkloadEnabled!==false;
  let cache=null, exclusions=[], daily=[], expiryTimer=null, queued=false, captureTimer=null, pendingCapture=null, editor=null;
  const emit=()=>{scheduleExpiry();listeners.forEach(fn=>fn());schedule();};
  function normalizeCache(value) {
    if (!value || !Number.isFinite(value.observedAt) || value.observedAt<0 || typeof value.complete!=='boolean' ||
        typeof value.source!=='string' || !/^easitPlusGroupingTableV1:[a-f0-9]{1,16}$/.test(value.source) ||
        !Array.isArray(value.counts) || value.counts.length>2000) return null;
    const seen=new Set(), counts=[];
    for (const item of value.counts) {
      const name=tidy(item?.name), id=key(name);
      if (!name || name.length>200 || seen.has(id) || !Number.isSafeInteger(item.total) || item.total<0 ||
          !Number.isSafeInteger(item.waiting) || item.waiting<0 || item.waiting>item.total) return null;
      seen.add(id);counts.push({name,total:item.total,waiting:item.waiting});
    }
    return {source:value.source,observedAt:value.observedAt,complete:value.complete,counts};
  }
  function normalizeExcluded(value) {
    if (!Array.isArray(value) || value.length>500 || value.some(name=>typeof name!=='string'||!tidy(name)||tidy(name).length>200)) return null;
    return [...new Map(value.map(name=>[key(name),tidy(name)])).values()].sort(collator.compare);
  }
  function normalizeDaily(value) {
    if(!Array.isArray(value)||value.length>500||value.some(item=>typeof item?.name!=='string'||!tidy(item.name)||tidy(item.name).length>200||!Number.isSafeInteger(item.until)||item.until<=0||item.until>8640000000000000))return null;
    return [...new Map(value.map(item=>[key(item.name),{name:tidy(item.name),until:item.until}])).values()].sort((a,b)=>collator.compare(a.name,b.name));
  }
  function activeDaily(){return daily.filter(item=>item.until>Date.now());}
  function excludedNames(){return [...new Map([...exclusions,...activeDaily().map(item=>item.name)].map(name=>[key(name),name])).values()].sort(collator.compare);}
  function scheduleExpiry() {
    clearTimeout(expiryTimer);expiryTimer=null;
    const upcoming=activeDaily().map(item=>item.until);
    if(enabled()&&cache&&new Date(cache.observedAt).toDateString()===new Date().toDateString()){
      const midnight=new Date();midnight.setHours(24,0,0,0);upcoming.push(midnight.getTime());
    }
    if(!upcoming.length)return;
    const delay=Math.min(...upcoming)-Date.now();
    expiryTimer=setTimeout(()=>{emit();refreshEditor();},Math.max(1,Math.min(delay,2147483647)));
  }
  api.changes.addListener((changes,area)=>{
    if (area!=='local') return;
    let changed=false;
    if (changes[CACHE]) {touched.add(CACHE);cache=normalizeCache(changes[CACHE].newValue);changed=true;}
    if (changes[EXCLUDED]) {touched.add(EXCLUDED);exclusions=normalizeExcluded(changes[EXCLUDED].newValue)||[];changed=true;}
    if (changes[DAILY]) {touched.add(DAILY);daily=normalizeDaily(changes[DAILY].newValue)||[];changed=true;}
    if (changed) {emit();refreshEditor();}
  });
  const ready=api.local.get([CACHE,EXCLUDED,DAILY]).then(data=>{
    if(!touched.has(CACHE))cache=normalizeCache(data[CACHE]);
    if(!touched.has(EXCLUDED))exclusions=normalizeExcluded(data[EXCLUDED])||[];
    if(!touched.has(DAILY))daily=normalizeDaily(data[DAILY])||[];
    emit();
  });
  const isExcluded=name=>exclusions.some(value=>key(value)===key(name))||daily.some(item=>item.until>Date.now()&&key(item.name)===key(name));
  function recommendation(select) {
    if(!cache||!enabled())return null;
    const counts=new Map(cache.counts.map(item=>[key(item.name),item]));
    const candidates=[],seen=new Set();
    for(const [index,option] of [...select.options].entries()) {
      const name=tidy(option.label||option.textContent),id=key(name);
      if(!name||seen.has(id)||option.disabled||option.hidden||isExcluded(name))continue;
      seen.add(id);
      const count=counts.get(id);
      // Missing people are zero only for a complete view. With unknown
      // workloads, do not present an unjustified least-busy recommendation.
      if(!count&&!cache.complete)return null;
      candidates.push({option,index,name,active:Math.max(0,(count?.total||0)-(count?.waiting||0))});
    }
    if(!candidates.length)return null;
    const minimum=Math.min(...candidates.map(item=>item.active));
    const tied=candidates.filter(item=>item.active===minimum);
    const signature=JSON.stringify(tied.map(item=>[key(item.name),item.active]));
    const previous=recommendations.get(select);
    const retained=previous?.signature===signature&&tied.find(item=>item.option===previous.option);
    if(retained)return retained;
    // Draw once per candidate set, so passive rendering and reopening cannot
    // move the star away from the recommendation the user is acting on.
    const chosen=tied.length===1?tied[0]:tied[Math.floor(Math.random()*tied.length)];
    recommendations.set(select,{signature,option:chosen.option});
    return chosen;
  }
  function rememberChoice(select,index) {
    const chosen=select.options[index],suggestion=recommendation(select);
    if(!suggestion||suggestion.option!==chosen)return;
    recommendations.delete(select);schedule();
  }
  function pageHidden(node) {
    for(let current=node;current;current=current.parentElement) {
      if(current.hidden || current.getAttribute('aria-hidden')==='true')return true;
      const style=getComputedStyle(current);
      if(style.display==='none'||style.visibility==='hidden')return true;
    }
    return false;
  }
  function mainLists(root) {
    return [...root.querySelectorAll('.z-listbox')].filter(list=>globalThis.EasitPlusScope.isMainList(list));
  }
  function listsForViewPath(node) {
    const caption=node.closest('.z-caption-content');
    if(caption) {
      const panel=caption.closest('.z-panel');
      return panel?mainLists(panel).filter(list=>list.closest('.z-panel')===panel):[];
    }
    const path=node.closest(VIEW);if(!path)return [];
    for(let root=path.parentElement;root;root=root.parentElement) {
      const lists=mainLists(root);if(lists.length)return lists;
    }
    return [];
  }
  function isQueue(list) {
    if(!enabled())return false;
    if (!globalThis.EasitPlusScope?.isMainList(list)) return false;
    const dashboard=!list.closest('.easit-item-view-widget');
    // The view path may sit beside the table widget. Use their nearest shared
    // container, and reject ambiguous containers instead of borrowing another
    // view's name. No ticket-tab names or individual row groups are inspected.
    for(let root=list.parentElement;root;root=root.parentElement) {
      if(dashboard&&root.matches('.z-panel')) {
        const captions=[...root.querySelectorAll('.z-caption-content')].filter(node=>node.closest('.z-panel')===root);
        const lists=mainLists(root).filter(node=>node.closest('.z-panel')===root);
        if(captions.length!==1||lists.length!==1||lists[0]!==list)return false;
        const selectors=[...captions[0].querySelectorAll(DASHBOARD_VIEW)];
        // Only the selected view names this queue; textContent includes every
        // available option, including 1st line in unrelated views.
        if(selectors.length)return selectors.length===1&&key(selectors[0].selectedOptions[0]?.textContent)==='1st line ärenden';
        const caption=captions[0].cloneNode(true);
        caption.querySelectorAll('button, [data-easit-plus-ui]').forEach(node=>node.remove());
        return /^1st\s+line(?:\s*[-–—:]?\s*ärenden)?$/.test(key(caption.textContent).replace(/^vy\s*[-–—:]\s*/,''));
      }
      const paths=[...root.querySelectorAll(VIEW)].filter(node=>!node.closest('.easit-item-form, .eFormFunctionContainer, .easit-function, .easit-history-function'));
      if(paths.length) {
        let lists=mainLists(root),candidates=paths;
        if(lists.length>1||candidates.length>1){lists=lists.filter(node=>!pageHidden(node));candidates=candidates.filter(node=>!pageHidden(node));}
        if(lists.length!==1||lists[0]!==list||candidates.length!==1)return false;
        const path=candidates[0];
        return key(tidy(path.textContent)||path.getAttribute('aria-label')?.replace(/^Vy\s+/i,''))==='1st line ärenden';
      }
    }
    return false;
  }
  function countsFor(handlers,statuses,exclude=false) {
    const counts=new Map();
    for (const [row,name] of handlers||[]) {
      if (exclude && isExcluded(name)) continue;
      const id=key(name);
      if (!counts.has(id))counts.set(id,{name,total:0,waiting:0});
      const count=counts.get(id);count.total++;
      if(key(statuses.get(row))==='väntar kund')count.waiting++;
    }
    return [...counts.values()];
  }
  function capture(list,handlers,statuses) {
    if (!handlers || !isQueue(list)) return;
    // Use all loaded rows, including rows hidden by our local filters.
    const rows=[...handlers.keys()];
    const info=list.querySelector('.z-paging-info')?.textContent||'';
    const total=info.match(/\/\s*(\d+)\s*\]/);
    // A transient empty body while Easit loads must not turn everyone into zero.
    if(!rows.length && (!total || Number(total[1])!==0))return;
    const page=list.querySelector('.z-paging-input');
    const complete=total?Number(total[1])===rows.length:!page;
    pendingCapture={list,source:globalThis.EasitPlusScope.tableKey(list),complete,
      counts:countsFor(handlers,statuses).sort((a,b)=>collator.compare(a.name,b.name))};
    clearTimeout(captureTimer);
    captureTimer=setTimeout(flushCapture,350);
  }
  async function flushCapture() {
    const next=pendingCapture;pendingCapture=null;
    if(!next?.list.isConnected || !isQueue(next.list))return;
    await ready;
    const value={source:next.source,observedAt:Date.now(),complete:next.complete,counts:next.counts};
    if(cache && cache.source===value.source && cache.complete===value.complete &&
       JSON.stringify(cache.counts)===JSON.stringify(value.counts) && Date.now()-cache.observedAt<60000)return;
    try {await api.local.set({[CACHE]:value});} catch { /* Keep the last saved snapshot. */ }
  }
  async function editExclusion(name,action) {
    await ready;
    const result=await api.send({type:'easit-plus-exclusion-edit-v1',name,action});
    if(!result?.ok)throw new Error('Kunde inte spara exkluderingen.');
  }
  const setExcluded=(name,excluded)=>editExclusion(name,excluded?'add':'remove');
  const excludeToday=name=>editExclusion(name,'today');
  const groupField=node=>!!node && (node.matches(GROUP)||node.matches('.eFormFieldContainer')&&!!node.querySelector('.easit-label[title="Handläggargrupp"]'));
  function handlerField(select) {
    const field=select.closest(HANDLER)||select.closest('.eFormFieldContainer');
    return field&&(field.matches(HANDLER)||field.querySelector('.easit-label[title="Handläggare"]'))?field:null;
  }
  function handlerSelects(root) {
    return [...root.querySelectorAll(HANDLER+' select, .eFormFieldContainer select.z-select')].filter(handlerField);
  }
  function relevant(node) {
    if(!node)return false;
    if(node.closest('[data-easit-plus-assignee-ui]'))return false;
    if(node.closest(GROUP+', '+HANDLER))return true;
    const field=node.closest('.eFormFieldContainer');
    return groupField(field)||!!field?.querySelector('.easit-label[title="Handläggare"]');
  }
  function groupFor(select) {
    const field=handlerField(select);if(!field)return '';
    const boundary=select.closest('.easit-item-form, form');
    // Pair the two labeled fields in their nearest shared container. A form
    // class or z-window is not required, and a sibling ticket cannot supply
    // the group when several handler/group pairs are present.
    for(let root=field.parentElement;root;root=root.parentElement) {
      const groups=[...root.querySelectorAll(GROUP+', .eFormFieldContainer')].filter(groupField);
      const handlers=handlerSelects(root);
      if(groups.length>1||handlers.length>1)return '';
      if(groups.length===1&&handlers.length===1&&handlers[0]===select) {
        const input=groups[0].querySelector('input:not([type="hidden"]), select');
        return key(input?.tagName==='SELECT'?input.selectedOptions[0]?.textContent:input?.value);
      }
      if(root===boundary)break;
    }
    return '';
  }
  function updateSelect(select) {
    const picker=globalThis.EasitPlusAssigneePicker;
    const first=enabled()&&groupFor(select)==='1st line';
    if(!first) {
      picker?.remove(select);
      recommendations.delete(select);
      readLabels.get(select)?.remove();readLabels.delete(select);
      decorated.delete(select);return;
    }
    decorated.add(select);
    const label=handlerField(select)?.querySelector('.easit-label[title="Handläggare"]');
    let stamp=readLabels.get(select);
    if(stamp&&stamp.parentElement!==label){stamp.remove();readLabels.delete(select);stamp=null;}
    if(label) {
      if(!stamp){stamp=document.createElement('span');stamp.className='easit-plus-assignee-read-time';label.append(stamp);readLabels.set(select,stamp);}
      const date=cache?new Date(cache.observedAt):null,when=date?.toLocaleString('sv-SE');
      const today=date?.toDateString()===new Date().toDateString();
      const text=today?' - Uppdaterades idag '+date.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}):' - Gå in på 1st line ärenden för att uppdatera listan';
      if(stamp.textContent!==text)stamp.textContent=text;
      if(when)stamp.title='1st line-listan lästes in '+when;
      else stamp.removeAttribute('title');
    } else if(stamp){stamp.remove();readLabels.delete(select);}
    const counts=new Map((cache?.counts||[]).map(item=>[key(item.name),item]));
    picker?.update(select,{countFor:name=>counts.get(key(name)),isExcluded,setExcluded,excludeToday,recommendation:()=>recommendation(select),onChoose:index=>rememberChoice(select,index),isActive:()=>enabled()&&groupFor(select)==='1st line'});
  }
  function render() {
    queued=false;observer.disconnect();
    try {
      const current=new Set(handlerSelects(document));
      for(const select of decorated)if(!current.has(select)){decorated.delete(select);readLabels.get(select)?.remove();readLabels.delete(select);globalThis.EasitPlusAssigneePicker?.remove(select);}
      current.forEach(updateSelect);
    } finally {observe();}
  }
  function schedule() {if(!queued){queued=true;requestAnimationFrame(render);}}
  const observer=new MutationObserver(records=>{
    if(records.some(record=>{
      const target=record.target instanceof Element?record.target:record.target.parentElement;
      if(relevant(target))return true;
      return [...record.addedNodes].some(node=>node instanceof Element && (relevant(node)||[...node.querySelectorAll(FIELDS)].some(relevant)));
    }))schedule();
  });
  function observe(){observer.observe(document,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value','selected','label','hidden','disabled','testid','title']});}
  for(const type of ['change','input','focusin','pointerdown'])window.addEventListener(type,event=>{
    const target=event.target instanceof Element?event.target:null;
    if(relevant(target)) {
      if(['pointerdown','focusin'].includes(type) && target.matches('select') && handlerField(target)) {
        observer.disconnect();try{updateSelect(target);}finally{observe();}
      } else schedule();
    }
  },true);
  function refreshEditor() {editor?.refresh();}
  function openSettings() {
    if(editor){editor.dialog.focus();return;}
    const prior=document.activeElement;
    const dialog=document.createElement('dialog');dialog.className='easit-plus-handlers easit-plus-queue-settings';
    dialog.setAttribute('data-easit-plus-local-ui','');dialog.setAttribute('aria-label','Inställningar för handläggare i 1st line');
    const header=document.createElement('div');header.className='easit-plus-handlers-header';
    const title=document.createElement('h2');title.textContent='Handläggare · 1st line';
    const close=document.createElement('button');close.type='button';close.className='easit-plus-handlers-close';close.setAttribute('aria-label','Stäng inställningarna');header.append(title,close);
    const description=document.createElement('p');description.textContent='Exkluderade namn döljs i översikten och samlas i en grå, valbar grupp i handläggarlistan för 1st line. Tilldelade ärenden ändras inte.';
    const form=document.createElement('form');form.className='easit-plus-queue-exclude-form';
    const label=document.createElement('label');label.textContent='Namn att exkludera';
    const input=document.createElement('input');input.type='text';input.maxLength=200;input.required=true;input.placeholder='Förnamn Efternamn';label.append(input);
    const add=document.createElement('button');add.type='submit';add.textContent='Lägg till';form.append(label,add);
    const error=document.createElement('p');error.setAttribute('role','status');
    const names=document.createElement('ul');names.className='easit-plus-queue-exclusions';
    dialog.append(header,description,form,error,names);
    const actions=new WeakMap();
    const done=()=>{dialog.close();dialog.remove();editor=null;const focus=prior?.isConnected?prior:document.querySelector('.easit-plus-handler-settings:not([hidden])');focus?.focus({preventScroll:true});};
    actions.set(close,done);dialog.addEventListener('cancel',event=>{event.preventDefault();done();});
    const refresh=()=>{
      names.replaceChildren();
      for(const name of excludedNames()) {
        const li=document.createElement('li'),text=document.createElement('span');text.textContent=name+(exclusions.some(value=>key(value)===key(name))?'':' · resten av dagen');
        const remove=document.createElement('button');remove.type='button';remove.textContent='Visa igen';remove.setAttribute('aria-label',`Visa ${name} igen`);
        actions.set(remove,async()=>{try{await setExcluded(name,false);error.textContent='';input.focus();}catch{error.textContent='Kunde inte spara inställningen.';}});
        li.append(text,remove);names.append(li);
      }
      if(!excludedNames().length){const li=document.createElement('li');li.textContent='Inga exkluderade namn.';names.append(li);}
    };
    form.addEventListener('submit',async event=>{
      event.preventDefault();const name=tidy(input.value);if(!name){input.focus();return;}
      add.disabled=true;
      try{await setExcluded(name,true);input.value='';error.textContent='';input.focus();}
      catch{error.textContent='Kunde inte spara inställningen.';}
      finally{add.disabled=false;}
    });
    editor={dialog,refresh,actions};refresh();document.body.append(dialog);dialog.showModal();input.focus();
  }
  // Isolate only the settings dialog; Easit's real select keeps its own events.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup','input','change'])window.addEventListener(type,event=>{
    if(!(event.target instanceof Element)||!event.target.closest('.easit-plus-queue-settings'))return;
    event.stopImmediatePropagation();
    if(type==='click') {
      const action=editor?.actions.get(event.target.closest('button'));
      if(action){event.preventDefault();action();}
    }
  },true);
  globalThis.EasitPlusFirstLine={ready,isQueue,listsForViewPath,countsFor,isExcluded,capture,openSettings,normalizeCache,normalizeExcluded,
    subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  globalThis.EasitPlusSettings?.subscribe(emit);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){emit();refreshEditor();}});
  window.addEventListener('focus',()=>{emit();refreshEditor();});
  observe();ready.then(schedule);
}

function initContent({window, document, globalThis, Element, MutationObserver, getComputedStyle}) {
  const CELL = 'td.z-listcell, td.z-gridcell';
  const OWN = '[data-easit-local-action]';
  const followup = globalThis.EasitPlusFollowup;
  const settings = globalThis.EasitPlusSettings;
  let context = null;
  const bindings = new WeakMap();
  const pending = new Set();
  let queued = false;

  function visible(element) {
    if (!element.isConnected || !element.getClientRects().length) return false;
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.visibility !== 'collapse';
  }

  function cellText(cell) {
    const content = cell.querySelector('.z-listcell-content, .z-gridcell-content') || cell;
    const controls = [...content.querySelectorAll('input, textarea, select')]
      .filter(visible).filter(el => el.type !== 'password' && el.type !== 'hidden');
    if (controls.length) return controls.map(el => {
      if (el.tagName === 'SELECT') return [...el.selectedOptions].map(o => o.text).join('\n');
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? 'Ja' : 'Nej';
      return el.value;
    }).join('\n').trim();
    const labels = [...content.querySelectorAll('.easit-showlabel')].filter(visible);
    const clone = content.cloneNode(true);
    clone.querySelectorAll('.easit-plus-followup, .easit-plus-unread, [data-easit-plus-addon]').forEach(node => node.remove());
    return (labels.length ? labels.map(el => el.innerText).join('\n') : clone.innerText)
      .replace(/\u00a0/g, ' ').trim();
  }

  function ticketLink(cell) {
    const list=cell?.closest('.z-listbox, .z-grid');
    const row=cell?.closest('tr.z-listitem, tr.z-row');
    if(!list || !row || row.closest('.z-listbox, .z-grid')!==list || !globalThis.EasitPlusScope?.isCell(cell)) return '';
    const headers=[...list.querySelectorAll('.z-listheader, .z-column')].filter(node=>node.closest('.z-listbox, .z-grid')===list);
    if(headers.length!==row.cells.length) return '';
    const index=headers.findIndex(node=>(followup?.text(node)||node.textContent.trim()).toLocaleUpperCase('sv')==='ID');
    if(index<0) return '';
    const id=(followup?.text(row.cells[index])||row.cells[index].textContent.trim());
    if(!/^\d+$/.test(id)) return '';
    return `https://sjalvservice-it.norrkoping.se/openItem/moduleId/1003/sequenceId/${id}`;
  }

  function menuList(popup) {
    const list = popup.querySelector(':scope > ul.z-menupopup-content');
    // Det stabila attributet identifierar huvudmenyn, inte undermenyer.
    return list?.querySelector(':scope > [testid="pivl-open-item-in-new-workspace"]') ? list : null;
  }

  function setIcon(action, kind, pinned) {
    if (kind === 'copy') return; // Behåll Easits befintliga kopieringsikon.
    const variant = kind === 'pin' && pinned ? 'unpin' : kind;
    if (action.querySelector('svg')?.getAttribute('data-icon') === variant) return;
    const paths = {
      link: ['M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2', 'M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2'],
      mark: ['M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5'],
      remove: ['M4 4h16v12H9l-5 4V4', 'M8 10h8'],
      pin: ['M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7', 'M12 16v6'],
      unpin: ['M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7', 'M12 16v6', 'M3 3l18 18'],
      note: ['M12 20H4V4h10', 'M16 3l5 5-9 9-5 1 1-5 8-10', 'M14 5l5 5']
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [name, value] of Object.entries({viewBox:'0 0 24 24', width:'16', height:'16', fill:'none', stroke:'currentColor', 'stroke-width':'1.8', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', focusable:'false', 'data-icon':variant})) svg.setAttribute(name, value);
    svg.classList.add('easit-plus-menu-icon');
    for (const shape of paths[variant] || paths.note) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', shape); svg.append(path);
    }
    action.querySelector('i, svg')?.remove();
    action.prepend(svg);
  }

  function update(popup) {
    const list = menuList(popup);
    if (!list) return;
    if (!context || !globalThis.EasitPlusScope?.isCell(context.cell) || !visible(popup) || !popup.classList.contains('z-menupopup-open')) {
      list.querySelectorAll(`:scope > ${OWN}`).forEach(item => item.remove());return;
    }
    const config=settings.get();
    const ticket=context.ticket;
    const entries=[];
    if(config.copyEnabled) {
      entries.push(['copy','Kopiera',!context.text]);
      entries.push(['link','Kopiera ärendelänk',!context.link]);
    }
    if(ticket) {
      entries.push(['pin',followup.getPinned(ticket.id)?'Lossa ärende':'Fäst ärende',false]);
      if(ticket.cell) entries.push(['note',followup.hasNote(ticket.id)?'Redigera anteckning':'Skriv anteckning',false]);
    }
    list.querySelectorAll(`:scope > ${OWN}`).forEach(item=>{
      if(!entries.some(([kind])=>item.dataset.easitLocalAction===kind)) item.remove();
    });
    let previous=[...list.children].find(node=>!node.matches(OWN) && node.matches('li.z-menuitem, li.z-menu'));
    for(const [kind,label,disabled] of entries) {
      let item=list.querySelector(`:scope > [data-easit-local-action="${kind}"]`);
      if(!item) {
        item=document.createElement('li');item.className='z-menuitem';item.setAttribute('role','none');
        item.dataset.easitLocalAction=kind;
        if(kind==='copy') item.setAttribute('data-easit-local-copy','');
        const action=document.createElement('a');action.className='z-menuitem-content';
        action.setAttribute('role','menuitem');action.href='#';action.tabIndex=0;
        const icon=document.createElement('i');icon.className=kind==='copy'?'fal fa-copy':'';
        icon.setAttribute('aria-hidden','true');
        const text=document.createElement('span');text.className='z-menuitem-text';
        action.append(icon,text);item.append(action);
      }
      // Säkerställ placeringen också vid Easits senare menyuppdateringar.
      if(previous && previous.nextElementSibling!==item) previous.after(item);
      else if(!previous && list.firstElementChild!==item) list.prepend(item);
      previous=item;
      setIcon(item.querySelector('a'), kind, ticket && followup?.getPinned(ticket.id));
      if(bindings.get(item)!==context || item.dataset.followupState!==label) {
        bindings.set(item,context);item.dataset.followupState=label;
        item.querySelector('.z-menuitem-text').textContent=label;
        item.classList.toggle('z-menuitem-disabled',disabled);
        item.querySelector('a').setAttribute('aria-disabled',String(disabled));
        item.querySelector('a').title=kind==='copy' ? (disabled?'Cellen är tom':'Kopiera den högerklickade cellens text') : kind==='link' ? (disabled?'Saknar giltigt ärendenummer i ID-kolumnen':context.link) : 'Sparas endast lokalt';
      }
    }
  }

  function queue(popup) {
    if (!popup) return;
    pending.add(popup);
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      const menus = [...pending];
      pending.clear();
      menus.forEach(update);
    });
  }
  function queueMenus() {document.querySelectorAll('.z-menupopup').forEach(queue);}
  function clear() {
    context = null;
    document.querySelectorAll(OWN).forEach(item => item.remove());
  }

  // Passiv observation: Easit får hantera originalhändelsen som vanligt.
  window.addEventListener('contextmenu', event => {
    if (event.target instanceof Element && event.target.closest('.z-menupopup')) return;
    // Återställ bara skriptets lokala döljning inför Easits nästa öppning.
    document.querySelectorAll('[data-easit-plus-menu-closed]').forEach(popup => {
      popup.removeAttribute('data-easit-plus-menu-closed');
    });
    const cell = event.target instanceof Element ? event.target.closest(CELL) : null;
    context = cell && globalThis.EasitPlusScope?.isCell(cell) && visible(cell) ? {cell, text: cellText(cell), link:ticketLink(cell), ticket:followup?.readRow(cell.closest('tr.z-listitem'))} : null;
    queueMenus();
  }, {capture: true, passive: true});
  window.addEventListener('pointerdown', event => {
    if (!(event.target instanceof Element) || event.target.closest('.z-menupopup')) return;
    clear();
  }, {capture: true, passive: true});
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') clear();
  }, {capture: true, passive: true});

  async function activate(item) {
    const selected=bindings.get(item);
    if(!selected || selected!==context || !globalThis.EasitPlusScope?.isCell(selected.cell) || item.querySelector('a').getAttribute('aria-disabled')==='true') return;
    try {
      const kind=item.dataset.easitLocalAction;
      if(kind==='copy') await globalThis.EasitPlusFeedback.copyText(selected.text);
      else if(kind==='link') {
        const link=ticketLink(selected.cell);
        if(!link || link!==selected.link) throw new Error('Ärenderaden har ändrats');
        await globalThis.EasitPlusFeedback.copyText(link);
      }
      else if(kind==='pin') await followup.pin(selected.ticket.id,selected.ticket);
      if(context===selected) {
        item.closest('.z-menupopup')?.setAttribute('data-easit-plus-menu-closed','');
        clear();
      }
      if(kind==='note') followup.editNote(selected.ticket);
    } catch {
      if(context===selected) item.querySelector('.z-menuitem-text').textContent=
        ['copy','link'].includes(item.dataset.easitLocalAction)?'Kunde inte kopiera':'Kunde inte spara markeringen';
    }
  }

  // Bara skriptets eget menyval isoleras från Easits kommandon.
  // Inga originalklick stoppas eller simuleras.
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'mouseover', 'mouseout']) {
    window.addEventListener(type, event => {
      const item = event.target instanceof Element ? event.target.closest(OWN) : null;
      if (!item) return;
      event.stopImmediatePropagation();
      if (type === 'click') {event.preventDefault(); activate(item);}
    }, true);
  }
  window.addEventListener('keydown', event => {
    const item = event.target instanceof Element ? event.target.closest(OWN) : null;
    if (!item || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    activate(item);
  }, true);

  const observer = new MutationObserver(records => {
    if (!context) return;
    for (const record of records) {
      if (record.target instanceof Element) queue(record.target.closest('.z-menupopup'));
      if (record.type !== 'childList') continue;
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.z-menupopup')) queue(node);
        node.querySelectorAll('.z-menupopup').forEach(queue);
      }
    }
  });
  observer.observe(document, {subtree: true, childList: true, attributes: true,
    attributeFilter: ['class', 'style', 'hidden']});
  settings.subscribe(queueMenus);
  followup?.subscribe(queueMenus);
}

function initGrouping({window, document, globalThis, Element, MutationObserver, requestAnimationFrame}) {
  const listData=globalThis.EasitPlusListData;
  const UI = '[data-easit-plus-ui]';
  const UNREAD = Object.freeze({filter:'unread'});
  const settings = globalThis.EasitPlusSettings;
  const states = new WeakMap();
  const actions = new WeakMap();
  const rowIds = new WeakMap();
  const pending = new Set();
  const collator = new Intl.Collator('sv', {sensitivity: 'base', numeric: true});
  let nextId = 0, scheduled = false;
  let settingsLoaded = false;
  let overlayOwner = null;

  function observe() {
    observer.observe(document, {subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['class', 'style', 'hidden', 'title', 'aria-label', 'selected', 'selectedindex']});
  }
  function queue(list) {
    if (!list) return;
    pending.add(list);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const lists = [...pending];
      pending.clear();
      // Egna flyttningar får inte starta en ny mutationsslinga.
      observer.disconnect();
      try {lists.forEach(render);} finally {observe();}
    });
  }
  function discover(node) {
    if (!(node instanceof Element)) return;
    if (node.closest(UI)) return;
    globalThis.EasitPlusFirstLine?.listsForViewPath(node).forEach(queue);
    queue(node.closest('.z-listbox'));
    node.querySelectorAll('.z-listbox').forEach(queue);
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (record.type === 'childList' && target instanceof Element &&
          [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && node.matches('tr.z-listitem'))) {
        const state = states.get(target.closest('.z-listbox'));
        if (state) state.refreshOrder = true;
      }
      discover(target);
      for (const node of record.addedNodes) discover(node);
    }
    if(overlayOwner&&!overlayOwner.list.isConnected)closeOverview(overlayOwner.list,overlayOwner.state,false);
  });
  // Native selectedIndex changes need not produce a DOM mutation. Let Easit
  // handle its original event and refresh only this panel's list.
  window.addEventListener('change',event=>{
    if(event.target instanceof Element&&event.target.matches('select[testid="ivm-item-view-listbox"]'))discover(event.target);
  },true);

  const statusText=(cell,fallback='Utan status')=>listData.text(cell)||fallback;
  const statusFamily=status=>['registrerad','registrerat','pågående'].includes(status.trim().toLocaleLowerCase('sv'))?'Pågående/Registrerad':status;
  function compareStatuses(a, b) {
    const rank = status => {
      const name = status.trim().toLocaleLowerCase('sv');
      return name === 'fästa ärenden' ? -1 : name === 'pågående/registrerad' ? 0 : 1;
    };
    return rank(a) - rank(b) || collator.compare(a, b);
  }
  function unreadRows(rows, enabled) {
    const unread = new Map();
    for (const row of rows) {
      // Ta också bort äldre versioners märkning i statuscellen.
      row.querySelectorAll('.easit-plus-unread').forEach(node => node.remove());
      unread.set(row, enabled && listData.unread(row));
    }
    return unread;
  }
  function toolbar(list, state, configuration, statuses, unread) {
    let bar = list.querySelector(':scope > .easit-plus-toolbar');
    if (!bar) {
      bar=document.createElement('div');bar.className='easit-plus-toolbar';bar.setAttribute('data-easit-plus-ui','');
      const button=document.createElement('button');button.type='button';button.className='easit-plus-group-switch';button.setAttribute('role','switch');
      const track=document.createElement('span');track.className='easit-plus-switch-track';track.setAttribute('aria-hidden','true');
      button.setAttribute('aria-label','Statusgruppering');button.title='Statusgruppering';
      const label=document.createElement('span');label.className='easit-plus-group-label';label.textContent='Statusgruppering';button.append(track,label);
      const tabs=document.createElement('div');tabs.className='easit-plus-status-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Filtrera ärenden på status');
      const select=document.createElement('select');select.className='easit-plus-status-select';select.setAttribute('aria-label','Filtrera ärenden på status');
      actions.set(select,()=>{state.active=select.options[select.selectedIndex]?._easitStatus??null;state.handler=null;queue(list);});
      const note=document.createElement('span');note.setAttribute('role','status');const overview=document.createElement('button');overview.type='button';overview.className='easit-plus-handlers-toggle';overview.textContent='Handläggare';overview.setAttribute('aria-expanded','false');overview.setAttribute('aria-haspopup','dialog');
      const filter=document.createElement('button');filter.type='button';filter.className='easit-plus-handler-clear';filter.hidden=true;
      const queueSettings=document.createElement('button');queueSettings.type='button';queueSettings.className='easit-plus-handler-settings';queueSettings.textContent='⚙';queueSettings.hidden=true;
      queueSettings.setAttribute('aria-label','Inställningar för handläggare i 1st line');queueSettings.title='Inställningar för handläggare i 1st line';
      actions.set(queueSettings,()=>globalThis.EasitPlusFirstLine?.openSettings());
      actions.set(overview,()=>{state.overviewOpen=!state.overviewOpen;queue(list);});
      actions.set(filter,()=>{state.handler=null;state.active=null;queue(list);
        bar.querySelector('.easit-plus-status-select').checkVisibility()?bar.querySelector('.easit-plus-status-select').focus():bar.querySelector('.easit-plus-status-tab').focus();});
      const controls=document.createElement('div');controls.className='easit-plus-toolbar-controls';
      controls.append(button,tabs,select,overview,queueSettings,filter,note);bar.append(controls);list.prepend(bar);
      actions.set(button,async()=>{
        button.disabled=true;
        try {await globalThis.EasitPlusScope.setGrouping(list,!state.enabled);note.textContent='';}
        catch {note.textContent='Kunde inte spara inställningen';}
        finally {button.disabled=false;}
      });
    }
    const button=bar.querySelector('.easit-plus-group-switch');button.setAttribute('aria-checked',String(configuration.groupingEnabled));
    const counts=new Map();for(const original of statuses.values()){const status=statusFamily(original);counts.set(status,(counts.get(status)||0)+1);}
    const unreadCount=[...unread.values()].filter(Boolean).length;
    if(unreadCount)counts.set(UNREAD,unreadCount);
    if(state.active!==null && !counts.has(state.active))state.active=null;
    const rank=status=>status==='Pågående/Registrerad'?0:status===UNREAD?1:status.toLocaleLowerCase('sv')==='väntar kund'?2:3;
    const ordered=[...counts.keys()].sort((a,b)=>rank(a)-rank(b)||collator.compare(a,b));
    const tabs=bar.querySelector('.easit-plus-status-tabs');
    const select=bar.querySelector('.easit-plus-status-select');
    const focusedTab=tabs.contains(document.activeElement)?document.activeElement:null;
    const values=[null,...ordered];
    for(const tab of [...tabs.children])if(!values.some(value=>tab._easitStatus===value))tab.remove();
    for(const option of [...select.options])if(!values.some(value=>option._easitStatus===value))option.remove();
    for(const [position,value] of values.entries()) {
      let tab=[...tabs.children].find(node=>node._easitStatus===value);
      if(!tab) {
        tab=document.createElement('button');tab.type='button';tab.className='easit-plus-status-tab';tab.setAttribute('role','tab');tab._easitStatus=value;
        actions.set(tab,()=>{state.active=value;state.handler=null;queue(list);});
      }
      const label=value===null?'Alla':value===UNREAD?'Oläst':value;
      const count=value===null?statuses.size:counts.get(value);
      if(tab.textContent!==`${label} (${count})`)tab.textContent=`${label} (${count})`;
      tab.setAttribute('aria-label',label);tab.setAttribute('aria-selected',String(state.active===value));tab.tabIndex=state.active===value?0:-1;
      if(tabs.children[position]!==tab)tabs.insertBefore(tab,tabs.children[position]||null);
      let option=[...select.options].find(node=>node._easitStatus===value);
      if(!option){option=document.createElement('option');option._easitStatus=value;}
      option.value=String(position);
      if(option.textContent!==tab.textContent)option.textContent=tab.textContent;
      if(select.options[position]!==option)select.insertBefore(option,select.options[position]||null);
      option.selected=state.active===value;
    }
    if(focusedTab && !focusedTab.isConnected)[...tabs.children].find(tab=>tab._easitStatus===state.active)?.focus({preventScroll:true});
  }
  function disposeOverview(state) {
    state.overviewPanel?.close();state.overviewPanel?.remove();state.overviewPanel=null;state.overviewSignature=null;
    if(overlayOwner?.state===state)overlayOwner=null;
  }
  function closeOverview(list,state,focus=true) {
    state.overviewOpen=false;disposeOverview(state);queue(list);
    if(focus&&list.isConnected)list.querySelector('.easit-plus-handlers-toggle:not([hidden]), .easit-plus-handler-settings:not([hidden])')?.focus({preventScroll:true});
  }
  function renderHandlers(list,state,statuses) {
    const bar=list.querySelector(':scope > .easit-plus-toolbar');
    const toggle=bar.querySelector('.easit-plus-handlers-toggle');
    const clear=bar.querySelector('.easit-plus-handler-clear');
    const main=globalThis.EasitPlusScope.isMainList(list);
    const firstLine=globalThis.EasitPlusFirstLine;
    const queue=!!firstLine?.isQueue(list);
    const counts=firstLine?firstLine.countsFor(state.handlers,statuses,queue):[];
    const people=counts.filter(item=>item.name!=='Utan handläggare').length;
    toggle.hidden=!main||people<=1;toggle.disabled=!state.handlers;
    // Keep settings reachable after exclusions leave zero or one visible person.
    bar.querySelector('.easit-plus-handler-settings').hidden=!queue||!toggle.hidden;
    if(state.handler && queue && firstLine.isExcluded(state.handler))state.handler=null;
    const selectedHandler=state.handler===null?'Handläggare':`Handläggare - ${state.handler}`;
    if(toggle.textContent!==selectedHandler)toggle.textContent=selectedHandler;
    toggle.title=state.handlers?'Visa antal laddade ärenden per handläggare':'Lägg till kolumnen Handläggare i tabellen för att visa översikten';
    toggle.setAttribute('aria-expanded',String(state.overviewOpen&&!!state.handlers));
    clear.hidden=state.handler===null&&state.active===null;
    clear.textContent='Rensa filter';
    clear.title=state.handler===null?'Visa alla statusar':`Visa alla ärenden · ${state.handler}`;
    let panel=state.overviewPanel;
    if(toggle.hidden||!state.handlers||!state.overviewOpen) {
      state.overviewOpen=false;
      disposeOverview(state);return;
    }
    const ordered=counts.map(item=>[item.name,item]).sort((a,b)=>Number(b[0]==='Utan handläggare')-Number(a[0]==='Utan handläggare')||collator.compare(a[0],b[0]));
    const signature=JSON.stringify([ordered,state.handler,queue]);
    if(panel&&state.overviewSignature===signature)return;
    if(!panel) {
      if(overlayOwner&&overlayOwner.state!==state)closeOverview(overlayOwner.list,overlayOwner.state,false);
      panel=document.createElement('dialog');panel.className='easit-plus-handlers';panel.setAttribute('data-easit-plus-ui','');panel.setAttribute('aria-label','Handläggaröversikt');
      state.overviewPanel=panel;overlayOwner={list,state};document.body.append(panel);
      actions.set(panel,()=>closeOverview(list,state));
      panel.addEventListener('cancel',event=>{event.preventDefault();closeOverview(list,state);});
    }
    const focusedName=panel.contains(document.activeElement)?document.activeElement._easitHandler:null;
    const focusedClose=document.activeElement?.matches('.easit-plus-handlers-close');
    const focusedSettings=document.activeElement?.matches('.easit-plus-handler-settings');
    panel.replaceChildren();
    const header=document.createElement('div');header.className='easit-plus-handlers-header';
    const title=document.createElement('h2');title.textContent='Handläggaröversikt';
    const close=document.createElement('button');close.type='button';close.className='easit-plus-handlers-close';close.setAttribute('aria-label','Stäng handläggaröversikten');
    actions.set(close,()=>closeOverview(list,state));header.append(title);
    const headerActions=document.createElement('div');headerActions.className='easit-plus-handlers-actions';
    if(queue) {
      const preferences=document.createElement('button');preferences.type='button';preferences.className='easit-plus-handler-settings';preferences.textContent='⚙';
      preferences.setAttribute('aria-label','Inställningar för handläggare i 1st line');preferences.title='Exkludera handläggare';
      actions.set(preferences,()=>firstLine.openSettings());headerActions.append(preferences);
    }
    headerActions.append(close);header.append(headerActions);
    const hint=document.createElement('p');hint.textContent='Totalt (Väntar kund)';
    const cards=document.createElement('ul');cards.className='easit-plus-handler-cards';
    for(const [name,count]of ordered) {
      const item=document.createElement('li');
      const button=document.createElement('button');button.type='button';button.className='easit-plus-handler-card';button._easitHandler=name;
      button.setAttribute('aria-pressed',String(state.handler===name));
      button.setAttribute('aria-label',`${name}: ${count.total} ärenden, ${count.waiting} väntar kund. Visa ärenden.`);
      button.title=`${count.total} ärenden (${count.waiting} Väntar kund)`;
      const numbers=document.createElement('span');numbers.className='easit-plus-handler-numbers';numbers.setAttribute('aria-hidden','true');
      const total=document.createElement('span');total.className='easit-plus-handler-total';total.textContent=String(count.total);
      const waiting=document.createElement('span');waiting.className='easit-plus-handler-waiting';waiting.textContent=`(${count.waiting})`;
      numbers.append(total,document.createTextNode(' '),waiting);
      const label=document.createElement('span');label.className='easit-plus-handler-name';label.textContent=name;
      button.append(numbers,label);
      actions.set(button,()=>{
        state.handler=name;state.active=null;closeOverview(list,state,false);
        requestAnimationFrame(()=>list.querySelector('.easit-plus-handler-clear')?.focus({preventScroll:true}));
      });
      item.append(button);cards.append(item);
    }
    panel.append(header,hint,cards);
    if(!ordered.length){const empty=document.createElement('p');empty.textContent='Inga laddade ärenden.';panel.append(empty);}
    state.overviewSignature=signature;
    if(!panel.open){panel.showModal();close.focus({preventScroll:true});}
    else if(focusedClose)close.focus({preventScroll:true});
    else if(focusedSettings)panel.querySelector('.easit-plus-handler-settings')?.focus({preventScroll:true});
    if(focusedName!==null)[...panel.querySelectorAll('button')].find(button=>button._easitHandler===focusedName)?.focus({preventScroll:true});
  }
  function originalRows(tbody) {
    return [...tbody.children].filter(node => node.matches('tr.z-listitem'));
  }
  function restore(state) {
    if (!state.tbody?.isConnected) return;
    state.tbody.querySelectorAll(':scope > .easit-plus-group').forEach(node => node.remove());
    const rows = originalRows(state.tbody);
    const rowSet=new Set(rows),known=new Set(state.order);
    const ordered = state.order.filter(row => rowSet.has(row));
    ordered.push(...rows.filter(row => !known.has(row)));
    for (const row of ordered) {
      row.classList.remove('easit-plus-collapsed','easit-plus-filtered');
      state.tbody.append(row);
    }
  }
  function clearColor(row) {
    row.removeAttribute('data-easit-plus-colored');
    row.style.removeProperty('--easit-plus-row-color');
  }
  function render(list) {
    if (!settingsLoaded) return;
    if(!list.isConnected){const state=states.get(list);if(state)disposeOverview(state);return;}
    if (!globalThis.EasitPlusScope?.isList(list)) {
      const state = states.get(list);
      if (state) {restore(state); state.signature = null;state.overviewOpen=false;disposeOverview(state);}
      list.querySelectorAll(':scope > .easit-plus-toolbar, :scope > .easit-plus-handlers').forEach(node=>node.remove());
      list.querySelectorAll('[data-easit-plus-addon], .easit-plus-unread, .easit-plus-followup').forEach(node => node.remove());
      list.querySelectorAll('[data-easit-plus-indicator-column]').forEach(node => node.removeAttribute('data-easit-plus-indicator-column'));
      list.querySelectorAll('[data-easit-plus-pinned]').forEach(row => row.removeAttribute('data-easit-plus-pinned'));
      list.querySelectorAll('[data-easit-plus-colored]').forEach(clearColor);
      return;
    }
    const configuration = settings.get();
    configuration.groupingEnabled = globalThis.EasitPlusScope.groupingEnabled(list, configuration.groupingEnabled);
    const mapping=listData.columns(list),{headers}=mapping;
    const statusIndex=mapping.index('STATUS');
    const body = [...list.querySelectorAll('.z-listbox-body')]
      .find(node => node.closest('.z-listbox') === list);
    let state = states.get(list);
    if (statusIndex < 0 || !body) {
      if (state) {restore(state); state.signature = null;state.overviewOpen=false;disposeOverview(state);}
      list.querySelectorAll(':scope > .easit-plus-toolbar, :scope > .easit-plus-handlers').forEach(node=>node.remove());
      list.querySelectorAll('[data-easit-plus-colored]').forEach(clearColor);
      list.querySelectorAll('.easit-plus-unread').forEach(node => node.remove());
      return;
    }
    const tbody = body.querySelector('tbody[id$="-rows"]') ||
      [...body.querySelectorAll('tbody')].find(node => originalRows(node).length || node.querySelector(':scope > .easit-plus-group'));
    if (!tbody) {if(state){state.overviewOpen=false;disposeOverview(state);}list.querySelectorAll(':scope > .easit-plus-toolbar, :scope > .easit-plus-handlers').forEach(node=>node.remove()); return;}
    const rows = originalRows(tbody);
    // Behåll ordinarie vy om rubriker och celler inte stämmer överens.
    if (rows.some(row => row.cells.length !== headers.length)) {
      if (state) {restore(state); state.signature = null;state.overviewOpen=false;disposeOverview(state);}
      list.querySelectorAll(':scope > .easit-plus-toolbar, :scope > .easit-plus-handlers').forEach(node=>node.remove());
      rows.forEach(clearColor);
      rows.forEach(row => row.querySelectorAll('.easit-plus-unread').forEach(node => node.remove()));
      return;
    }
    if (!state) {
      state = {enabled: true, collapsed: new Set(), order: [], tbody, signature: null, active: null, handler: null, overviewOpen: false, overviewSignature: null};
      states.set(list, state);
    }
    state.enabled = configuration.groupingEnabled;
    if (state.tbody !== tbody) {
      restore(state); state.tbody = tbody; state.order = []; state.signature = null; state.active = null;
    }
    if (state.refreshOrder) {state.order = [...rows]; state.refreshOrder = false;}
    const rowSet=new Set(rows),known=new Set(state.order);
    state.order = state.order.filter(row => rowSet.has(row));
    state.order.push(...rows.filter(row => !known.has(row)));
    globalThis.EasitPlusFollowup?.renderRows(rows, true, list, mapping);
    const pinned = new Map(rows.map(row => [row, row.hasAttribute('data-easit-plus-pinned')]));
    const statuses = new Map(state.order.map(row => [row, statusText(row.cells[statusIndex])]));
    const handlerIndex=mapping.handler;
    state.handlers=globalThis.EasitPlusScope.isMainList(list)&&handlerIndex>=0?new Map(state.order.map(row=>[row,statusText(row.cells[handlerIndex],'Utan handläggare')])):null;
    globalThis.EasitPlusFirstLine?.capture(list,state.handlers,statuses);
    if(!state.handlers)state.handler=null;
    const unread=unreadRows(rows,true);
    toolbar(list,state,configuration,statuses,unread);
    renderHandlers(list,state,statuses);
    const grouped=state.enabled && state.active===null && state.handler===null;
    const groupStatuses = new Map([...statuses].map(([row, status]) => [row,
      pinned.get(row) ? 'Fästa ärenden' : statusFamily(status)]));
    state.collapsed=new Set([...new Set(groupStatuses.values())].filter(status=>globalThis.EasitPlusScope.isCollapsed(list,status)));
    const filtered=row=>(state.active===UNREAD?!unread.get(row):state.active!==null&&statusFamily(statuses.get(row))!==state.active)||(state.handler!==null&&state.handlers?.get(row)!==state.handler);
    rows.forEach(clearColor);
    const signature = JSON.stringify([configuration, state.active, state.handler, statusIndex, headers.length,
      [...state.collapsed].sort(), state.order.map(row => {
        if (!rowIds.has(row)) rowIds.set(row, ++nextId);
        return [rowIds.get(row), statuses.get(row), unread.get(row), pinned.get(row), state.handlers?.get(row)];
      })]);
    const layout = [...tbody.children].filter(node => node.matches('tr.z-listitem, .easit-plus-group'));
    if (state.signature === signature &&
        rows.every(row => row.classList.contains('easit-plus-collapsed') === (grouped && state.collapsed.has(groupStatuses.get(row))) && row.classList.contains('easit-plus-filtered')===filtered(row)) &&
        state.layout?.length === layout.length && state.layout.every((node, i) => node === layout[i])) return;
    const focusedStatus = document.activeElement?.closest('.easit-plus-group')?.getAttribute('data-easit-plus-status');
    tbody.querySelectorAll(':scope > .easit-plus-group').forEach(node => node.remove());
    for (const row of rows) row.classList.remove('easit-plus-collapsed','easit-plus-filtered');
    for(const row of rows)row.classList.toggle('easit-plus-filtered',filtered(row));
    if (!grouped) {
      [...state.order].sort((a, b) => Number(pinned.get(b)) - Number(pinned.get(a))).forEach(row => tbody.append(row));
    } else {
      const groups = new Map();
      for (const row of state.order) {
        const status = groupStatuses.get(row);
        if (!groups.has(status)) groups.set(status, []);
        groups.get(status).push(row);
      }
      for (const status of [...groups.keys()].sort(compareStatuses)) {
        const groupRows = groups.get(status);
        const collapsed = state.collapsed.has(status);
        const heading = document.createElement('tr');
        heading.className = 'easit-plus-group';
        heading.setAttribute('data-easit-plus-status', status);
        heading.setAttribute('data-easit-plus-ui', '');
        heading.setAttribute('role', 'row');
        const cell = document.createElement('td');
        cell.colSpan = headers.length;
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-expanded', String(!collapsed));
        button.textContent = `${collapsed ? '▸' : '▾'} ${status} (${groupRows.length})`;
        const unreadCount = configuration.unreadEnabled?groupRows.filter(row => unread.get(row)).length:0;
        if (unreadCount) {
          const badge = document.createElement('span');
          badge.className = 'easit-plus-unread';
          badge.textContent = ` (${unreadCount}) Oläst meddelande`;
          badge.title = 'Antal ärenden i gruppen med oläst e-post';
          button.append(badge);
        }
        actions.set(button, async () => {
          button.disabled=true;
          try {await globalThis.EasitPlusScope.setCollapsed(list,status,!state.collapsed.has(status));}
          catch {list.querySelector('.easit-plus-toolbar [role="status"]').textContent='Kunde inte spara kollapsläget';}
          finally {button.disabled=false;queue(list);}
        });
        cell.append(button); heading.append(cell); tbody.append(heading);
        for (const row of groupRows) {
          row.classList.toggle('easit-plus-collapsed', collapsed);
          tbody.append(row);
        }
      }
    }
    state.signature = signature;
    state.layout = [...tbody.children].filter(node => node.matches('tr.z-listitem, .easit-plus-group'));
    if (focusedStatus !== undefined && focusedStatus !== null) {
      const heading = [...tbody.querySelectorAll(':scope > .easit-plus-group')]
        .find(node => node.getAttribute('data-easit-plus-status') === focusedStatus);
      heading?.querySelector('button').focus({preventScroll: true});
    }
  }

  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu']) {
    window.addEventListener(type, event => {
      const control = event.target instanceof Element ? event.target.closest(UI) : null;
      if (!control) return;
      event.stopImmediatePropagation();
      if (type === 'click') {
        const button = event.target.closest('button');
        if(button){event.preventDefault();actions.get(button)?.();}
        if(event.target===control&&control.matches('.easit-plus-handlers')) {
          const rect=control.getBoundingClientRect();
          if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)actions.get(control)?.();
        }
      }
    }, true);
  }
  for(const type of ['input','change'])window.addEventListener(type,event=>{
    const select=event.target instanceof Element?event.target.closest('.easit-plus-status-select'):null;
    if(!select || !select.closest(UI))return;
    event.stopImmediatePropagation();
    if(type==='change')actions.get(select)?.();
  },true);
  window.addEventListener('keydown',event=>{
    const tab=event.target instanceof Element?event.target.closest('.easit-plus-status-tab'):null;
    if(!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();event.stopImmediatePropagation();
    const tabs=[...tab.parentElement.children],index=tabs.indexOf(tab);
    const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
    actions.get(next)?.();next.focus({preventScroll:true});
  },true);
  window.addEventListener('keydown', event => {
    if (!(event.target instanceof Element) || !event.target.closest(UI)) return;
    if(event.target.matches('input, textarea, select')){event.stopImmediatePropagation();return;}
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    actions.get(event.target.closest('button'))?.();
  }, true);
  observe();
  settings.subscribe(() => document.querySelectorAll('.z-listbox').forEach(queue));
  globalThis.EasitPlusFollowup?.subscribe(() => document.querySelectorAll('.z-listbox').forEach(queue));
  globalThis.EasitPlusFirstLine?.subscribe(() => document.querySelectorAll('.z-listbox').forEach(queue));
  setInterval(() => document.querySelectorAll('.z-listbox').forEach(queue), 60000);
  document.addEventListener('visibilitychange', () => document.querySelectorAll('.z-listbox').forEach(queue));
  globalThis.EasitPlusScope?.subscribe?.(() => document.querySelectorAll('.z-listbox').forEach(queue));
  Promise.all([settings.ready, globalThis.EasitPlusFollowup?.ready, globalThis.EasitPlusScope?.ready, globalThis.EasitPlusFirstLine?.ready]).then(() => {
    settingsLoaded = true;
    document.querySelectorAll('.z-listbox').forEach(queue);
  }).catch(() => {});
}

/* Draw the E+ symbol in the header and panel. */
function initIcon({globalThis}) {
  const DEFAULT = '#2d8ab3';
  const color = settings => settings?.themeEnabled && /^#[a-f0-9]{6}$/i.test(settings.themeColor || '') ? settings.themeColor : DEFAULT;
  function foreground(background) {
    const rgb = background.slice(1).match(/../g).map(x => parseInt(x,16)/255)
      .map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
    return rgb.reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0) > .45 ? '#142333' : '#ffffff';
  }
  function draw(context, size, background = DEFAULT) {
    context.clearRect(0,0,size,size);
    context.save(); context.scale(size/128,size/128);
    context.fillStyle = background;
    context.beginPath(); context.roundRect(0,0,128,128,24); context.fill();
    context.fillStyle = foreground(background);
    context.fillRect(22,30,14,68); context.fillRect(22,30,43,13);
    context.fillRect(22,57,36,13); context.fillRect(22,85,43,13);
    context.fillRect(86,47,12,40); context.fillRect(72,61,40,12);
    context.restore();
  }
  function drawAlert(context,size) {
    context.clearRect(0,0,size,size);context.save();context.scale(size/128,size/128);
    context.fillStyle='#b42318';context.beginPath();context.roundRect(0,0,128,128,24);context.fill();
    context.fillStyle='#ffffff';context.fillRect(56,25,16,49);context.fillRect(56,87,16,16);context.restore();
  }
  globalThis.EasitPlusIcon = {color, foreground, draw,drawAlert};
}

/* Mount the Easit+ panel beside the global search. */
function initHeaderPopup({window, document, globalThis, MutationObserver, requestAnimationFrame}) {
  if (window !== window.top || globalThis.EasitPlusHeaderPopup) return;
  globalThis.EasitPlusHeaderPopup = true;
  const SEARCH = '.search-container .super-search';
  let search = null, host = null, button = null, canvas = null, layer = null, panel = null, frame = null;
  let popupView, pendingNotes = false;
  let queued = false, stopped = false, opened = false, frameReady = false, requestId = 0;

  function stop() {
    stopped = true; observer.disconnect(); destroyPopup(); host?.remove(); unsubscribe?.();
    window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true);
    document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true);
    window.removeEventListener('message', message);
  }
  window.addEventListener("pagehide", event => { if (!event.persisted) stop(); });
  function draw() {
    if (!canvas) return;
    const due=globalThis.EasitPlusReminders?.hasDue();
    if(due)globalThis.EasitPlusIcon.drawAlert(canvas.getContext('2d'),64);
    else globalThis.EasitPlusIcon.draw(canvas.getContext('2d'), 64, globalThis.EasitPlusIcon.color(globalThis.EasitPlusSettings.get()));
    button.title=due?'Öppna Easit+ · Uppföljning väntar':'Öppna Easit+';
    button.setAttribute('aria-label',button.title);
  }
  function position() {
    if (!panel || !opened) return;
    const rect = host?.getBoundingClientRect() ?? {left:8,bottom:0};
    const width = Math.min(390, window.innerWidth - 16);
    const height = Math.min(600, Math.max(120, window.innerHeight - 16));
    panel.style.width = width + 'px'; panel.style.height = height + 'px';
    panel.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + 'px';
    panel.style.top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - height - 8)) + 'px';
  }
  function close(focus = true) {
    opened = false; requestId++;
    try {if(frameReady)frame?.contentWindow.postMessage({type:'easit-plus-popup-hidden'},site);}catch{/* Context invalidated. */}
    if (panel?.matches(':popover-open')) panel.hidePopover();
    button?.setAttribute('aria-expanded', 'false');
    button?.removeAttribute('aria-busy');
    if (focus && host?.isConnected) button?.focus();
  }
  function destroyPopup() {
    popupView?.dispose(); close(false); frameReady = false; layer?.remove(); layer = panel = frame = null;
  }
  function requestReady() {
    if (!frame || !opened || !frameReady) return;
    const next = ++requestId;
    frame.contentWindow.postMessage({type:'easit-plus-popup-prepare', requestId:next}, site);
  }
  function prepare() {
    if (stopped) return;
    if (panel) return;
    // A high z-index inside the header cannot escape its stacking/clip context.
    // Use a separate root and the browser's non-modal top layer instead.
    layer = document.createElement('easit-plus-popup-layer');
    layer.setAttribute('data-easit-plus-addon', ''); layer.setAttribute('data-easit-plus-local-ui', '');
    const root = layer.attachShadow({mode:'open'}), style = document.createElement('style');
    style.textContent = `:host{display:contents;}
      section{position:fixed;inset:auto;margin:0;padding:0;border:0;outline:1px solid var(--easit-plus-ui-border,var(--easit-plus-border-e2e8f0,#e2e8f0));z-index:2147483647;box-sizing:border-box;border-radius:var(--easit-plus-ui-radius,7.8125px);background:var(--easit-plus-ui-surface,var(--easit-plus-surface-ffffff,#fff));box-shadow:var(--easit-plus-ui-shadow,0 3.125px 15.625px #00000012);overflow:hidden;}
      section:popover-open{animation:popup-enter var(--easit-plus-ui-enter,180ms) ease-out;}
      @keyframes popup-enter{from{opacity:0}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){section:popover-open{animation:none}}
      iframe{display:block;width:100%;height:100%;border:0;background:var(--easit-plus-ui-surface,var(--easit-plus-surface-ffffff,#fff));}`;
    panel = document.createElement('section'); panel.id = 'popup';
    panel.setAttribute('popover', 'manual');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Easit+');
    frame = document.createElement('iframe'); frame.title = 'Easit+'; frame.allow = 'clipboard-write'; popupView = mountPopup(frame, data => message({data, source:frame?.contentWindow, origin:site}), globalThis);
    // Wait for the embedded panel to finish initialization.
    panel.append(frame); root.append(style, panel); isolate(root);
    (document.body || document.documentElement).append(layer);
  }
  function toggle() {
    if (stopped) return;
    if (opened) {close(); return;}
    prepare(); opened = true;
    button.setAttribute('aria-expanded', 'true'); button.setAttribute('aria-busy', 'true');
    requestReady();
  }
  globalThis.openChangelog = () => {
      pendingNotes = true;
      if (!opened) {
        prepare(); opened = true;
        button?.setAttribute('aria-expanded','true');
      }
      requestReady();
    };
    function outside(event) {
    if (!opened) return;
    const path = event.composedPath();
    if (!path.includes(host) && !path.includes(layer)) close(false);
  }
  function escape(event) {
    if (opened && event.key === 'Escape') {event.preventDefault(); event.stopImmediatePropagation(); close();}
  }
  function message(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== site) return;
    if(event.data?.type==='easit-plus-copy-feedback-v1'){globalThis.EasitPlusFeedback?.showCopy();return;}
    if (event.data?.type === 'easit-plus-popup-loaded') {
      frameReady = true;requestReady();return;
    }
    if (event.data?.type === 'easit-plus-popup-loading') {
      frameReady = false;
      requestId++;
      if (panel.matches(':popover-open')) panel.hidePopover();
      if (opened) button.setAttribute('aria-busy', 'true');
      return;
    }
    if (event.data?.type === 'easit-plus-popup-close') {if (opened) close(); return;}
    if (event.data?.type === 'easit-plus-popup-ready' && opened && event.data.requestId === requestId) {
      position();
      if (!panel.matches(':popover-open')) panel.showPopover();
      button?.removeAttribute('aria-busy'); frame.focus(); if (pendingNotes) { pendingNotes = false; popupView.openNotes(); }
    }
  }
  function mount() {
    queued = false;
    if (stopped) return;
    const next = document.querySelector(SEARCH);
    if (next === search && host?.isConnected && host.nextSibling === search) return;
    close(false); host?.remove(); search?.parentElement?.classList.remove('easit-plus-search-container');
    search = next;
    if (!search) {destroyPopup(); return;}
    host = document.createElement('easit-plus-header');
    host.setAttribute('data-easit-plus-addon', ''); host.setAttribute('data-easit-plus-local-ui', '');
    const root = host.attachShadow({mode:'open'}), style = document.createElement('style');
    style.textContent = `:host{display:inline-flex;flex:0 0 36px;width:36px;height:36px;vertical-align:middle;}
      button{display:grid;place-items:center;box-sizing:border-box;width:36px;height:36px;padding:2px;border:0;border-radius:var(--easit-plus-ui-radius,7.8125px);background:transparent;cursor:pointer;}
      button{transition:background-color var(--easit-plus-ui-fast,140ms) ease;}
      button[aria-expanded=true]{background:var(--easit-plus-ui-selected,#e8f0fe);}
      @media(prefers-reduced-motion:reduce){button{transition:none}}
      button:hover{background:var(--easit-plus-ui-hover,var(--easit-plus-surface-f1f5f9,#f1f5f9));}button:focus-visible{outline:2px solid var(--easit-plus-ui-accent,var(--easit-plus-primary,#2d8ab3));outline-offset:2px;}
      canvas{display:block;width:32px;height:32px;}`;
    button = document.createElement('button'); button.type = 'button'; button.title = 'Öppna Easit+';
    button.setAttribute('aria-label', 'Öppna Easit+'); button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    canvas = document.createElement('canvas'); canvas.width = canvas.height = 64; canvas.setAttribute('aria-hidden','true');
    button.append(canvas); button.addEventListener('click', event => {event.stopPropagation(); toggle();});
    button.addEventListener('pointerenter', prepare); button.addEventListener('focus', prepare);
    isolate(root);
    root.append(style, button); search.parentElement.classList.add('easit-plus-search-container');
    search.before(host); draw();
  }
  function isolate(root) {
    // Keep Easit's delegated handlers away from this module's own controls.
    for (const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown']) root.addEventListener(type, event => event.stopPropagation());
  }
  function schedule() {if (!queued && !stopped) {queued = true; requestAnimationFrame(mount);}}
  const observer = new MutationObserver(mutations => {
    if (stopped) return;
    if (!search?.isConnected || !host?.isConnected || host.nextSibling !== search) {schedule(); return;}
    for (const mutation of mutations) for (const node of mutation.addedNodes) {
      if (node.nodeType === 1 && (node.matches('.search-container,.super-search') || node.querySelector(SEARCH))) {schedule(); return;}
    }
  });
  observer.observe(document, {childList:true,subtree:true});
  const unsubscribe = globalThis.EasitPlusSettings.subscribe(draw);
  globalThis.EasitPlusReminders?.subscribe(draw);
  globalThis.EasitPlusSettings.ready.then(draw).catch(() => {});
  document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', escape, true);
  window.addEventListener('message', message); window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
  schedule();
}

function initMailActions({window, document, globalThis, Element, HTMLInputElement, MutationObserver, getComputedStyle, requestAnimationFrame}) {
  if(globalThis.EasitPlusMailActions)return;
  const WINDOWS='.easit-message-email-window',OWN='[data-easit-plus-mail-ui]';
  const states=new Map(),actions=new WeakMap();let queued=false;
  const settings=globalThis.EasitPlusSettings;let settingsReady=!settings;
  const enabled=()=>settingsReady&&settings?.get().mailUnreadEnabled!==false;
  const text=node=>node.textContent.replace(/\s+/g,' ').trim();
  function visible(node) {
    for(let current=node;current;current=current.parentElement){
      if(current.hidden||current.getAttribute('aria-hidden')==='true')return false;
      const css=getComputedStyle(current);if(css.display==='none'||css.visibility==='hidden')return false;
    }
    return node.isConnected;
  }
  function unreadFields(root) {
    const fields=new Set();
    for(const label of root.querySelectorAll('.easit-label[title="Oläst e-post"]')){
      const field=label.closest('.eFormFieldContainer');if(!field||!visible(field))continue;
      const inputs=[...field.querySelectorAll('input[type="checkbox"]')];if(inputs.length===1)fields.add(inputs[0]);
    }
    return [...fields];
  }
  function unreadFor(window) {
    const form=window.closest('.easit-item-form, form');
    if(!form&&[...document.querySelectorAll(WINDOWS)].filter(visible).length!==1)return null;
    const fields=unreadFields(form||document);
    // Portaled mail windows have no reliable generated ID linking them to a
    // ticket. Only act when exactly one visible native field can be the owner.
    return fields.length===1?fields[0]:null;
  }
  function closeFor(window) {
    const buttons=[...window.querySelectorAll('button.z-button')].filter(button=>button.closest(WINDOWS)===window&&!button.closest(OWN)&&text(button)==='Stäng'&&visible(button));
    return buttons.length===1?buttons[0]:null;
  }
  function usable(node) {return node&&visible(node)&&!node.disabled&&node.getAttribute('aria-disabled')!=='true';}
  window.addEventListener('click',event=>{
    if(!enabled()||!event.isTrusted||event.defaultPrevented||event.button!==0)return;
    const button=event.target instanceof Element?event.target.closest('button.z-button'):null;
    const window=button?.closest(WINDOWS);
    if(!window||button.closest(OWN)||text(button)!=='Skicka'||!usable(button))return;
    const sends=[...window.querySelectorAll('button.z-button')].filter(node=>node.closest(WINDOWS)===window&&text(node)==='Skicka'&&visible(node));
    const input=unreadFor(window);
    if(sends.length!==1||!usable(input)||!input.checked)return;
    // Update the native field before Easit's send handler. Leave the original
    // click untouched, including validation and any confirmation dialogs.
    input.click();schedule();
  },true);
  function activate(state) {
    const {window}=state,target=unreadFor(window),original=closeFor(window);
    if(!enabled()||target!==state.input||original!==state.close||!usable(target)||!usable(original)||!target.checked){schedule();return;}
    target.click();schedule();
    // Respect cancellation and retain Easit's native close/draft confirmation.
    // This command never sends a message or saves the ticket automatically.
    if(!target.checked&&original.isConnected&&closeFor(window)===original)original.click();
  }
  function render() {
    queued=false;observer.disconnect();
    try {
      const current=new Set(document.querySelectorAll(WINDOWS));
      for(const [window,state]of states)if(!current.has(window)){state.host.remove();states.delete(window);}
      for(const window of current){
        const close=closeFor(window),input=unreadFor(window);let state=states.get(window);
        if(!enabled()||!close||!input?.checked){state?.host.remove();states.delete(window);continue;}
        const anchor=close.closest('.z-hlayout-inner')||close;
        if(!state){
          const host=document.createElement('div');host.className='z-hlayout-inner easit-plus-mail-action';host.setAttribute('data-easit-plus-mail-ui','');host.setAttribute('data-easit-plus-local-ui','');
          const button=document.createElement('button');button.type='button';button.className='button-default z-button';button.textContent='Stäng och markera som läst';host.append(button);
          state={host,button,window};states.set(window,state);actions.set(host,state);
        }
        state.input=input;state.close=close;
        state.button.disabled=!usable(input)||!usable(close);
        if(anchor.nextSibling!==state.host)anchor.after(state.host);
      }
    } finally {observe();}
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  function relevant(node){return node instanceof Element&&(node.matches(WINDOWS+',.eFormFieldContainer')||node.closest(WINDOWS+',.eFormFieldContainer')||node.querySelector(WINDOWS+',.eFormFieldContainer'));}
  const observer=new MutationObserver(records=>{
    if(records.some(record=>relevant(record.target instanceof Element?record.target:record.target.parentElement)||[...record.addedNodes,...record.removedNodes].some(relevant)))schedule();
  });
  function observe(){observer.observe(document,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','aria-disabled','aria-hidden','style','class','title','checked']});}
  for(const type of ['input','change'])document.addEventListener(type,event=>{
    const input=event.target;
    if(input instanceof HTMLInputElement&&input.type==='checkbox'&&input.closest('.eFormFieldContainer')?.querySelector('.easit-label[title="Oläst e-post"]'))schedule();
  },true);
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keyup'])window.addEventListener(type,event=>{
    const host=event.target instanceof Element?event.target.closest(OWN):null,state=host&&actions.get(host);
    if(!state)return;event.stopImmediatePropagation();
    if(type==='click'){event.preventDefault();if(!state.button.disabled&&event.target.closest('button')===state.button)activate(state);}
  },true);
  settings?.subscribe(schedule);
  settings?.ready.then(()=>{settingsReady=true;schedule();});
  observe();schedule();globalThis.EasitPlusMailActions={refresh:schedule};
}

function initActionsUndo({window, document, location, globalThis, Element, MutationObserver}) {
  const FIELD = '[testid="component-Åtgärder"]';
  const settings = globalThis.EasitPlusSettings;
  const states = new Map();
  let enabled = false, timer, url = location.href;

  function editors(field) {
    const [editor, history] = field.querySelectorAll('textarea');
    if (editor && !editor.readOnly && history?.readOnly) return {editor, history};
    return null;
  }
  function scope(field) {
    return field.closest('.easit-item-form, form') || field.parentElement;
  }
  function discard(state) {
    state.draft = '';
    state.button?.remove();
  }
  function restore(state) {
    if (!enabled || location.href !== url || !state.field.isConnected || !state.draft) return;
    const target = editors(state.field)?.editor;
    if (!target || target !== state.editor || target.value || target.matches(':disabled, [aria-disabled="true"]')) return;
    target.focus();
    if (document.activeElement !== target || !target.isConnected || target.value || editors(state.field)?.editor !== target) return;
    const draft = state.draft;
    target.setRangeText(draft, 0, 0, 'end');
    target.dispatchEvent(new window.InputEvent('input', {bubbles:true, inputType:'insertReplacementText', data:draft}));
    update(state);
  }
  function addButton(state) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'easit-plus-actions-undo';
    button.title = 'Återställ text i Åtgärder';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('data-easit-plus-local-ui', '');
    button.append(strokeIcon(document, 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'));
    button.addEventListener('click', event => {event.stopPropagation(); restore(state);});
    return button;
  }
  function update(state, userEdit = false) {
    const {editor, history} = state;
    if (editor.value) {
      if (userEdit || editor.value !== state.draft) state.historyValue = history.value;
      state.draft = editor.value;
      state.button?.remove();
    } else if (userEdit || (history.value !== state.historyValue && state.draft.trim() &&
      history.value.includes(state.draft.trim()))) {
      // A successful save can also empty the field. The draft is now in the log.
      discard(state);
    } else if (state.draft && !editor.matches(':disabled, [aria-disabled="true"]')) {
      state.button ??= addButton(state);
      if (editor.nextSibling !== state.button) editor.after(state.button);
    } else {
      state.button?.remove();
    }
  }
  function checkDrafts() {
    clearTimeout(timer);
    if (location.href !== url) {
      url = location.href;
      for (const state of states.values()) discard(state);
      return;
    }
    if (!enabled) return;
    let hasDraft = false;
    for (const state of states.values()) {
      if (state.editor?.isConnected && state.field.contains(state.editor)) update(state);
      hasDraft ||= !!state.draft;
    }
    // Setting textarea.value doesn't emit a mutation or necessarily an input
    // event. Only check it periodically while a draft exists in this document.
    if (hasDraft) timer = setTimeout(checkDrafts, 200);
  }
  function syncFields() {
    if (!enabled) return;
    const fields = new Set(document.querySelectorAll(FIELD));
    const detached = [];
    for (const [field, state] of states) {
      if (fields.has(field)) continue;
      state.button?.remove();
      detached.push(state);
      states.delete(field);
    }
    for (const field of fields) {
      let state = states.get(field);
      const controls = editors(field);
      if (!controls) {
        state?.button?.remove();
        if (state) state.editor = null;
        continue;
      }
      if (!state) {
        const owner = scope(field);
        // A ZK redraw may replace the entire field. Reuse a draft only when
        // the widget ID and its still-mounted form both match.
        state = field.id && detached.find(old => old.field.id === field.id && old.owner === owner);
        state ||= {owner, draft:'', historyValue:controls.history.value};
        state.field = field;
        states.set(field, state);
      }
      Object.assign(state, controls);
    }
    checkDrafts();
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.target instanceof Element && record.target.closest(FIELD) ||
      [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
        (node.matches(FIELD) || node.querySelector(FIELD))))) syncFields();
  });
  document.addEventListener('input', event => {
    if (!enabled || !(event.target instanceof window.HTMLTextAreaElement)) return;
    const field = event.target.closest(FIELD);
    if (!field) return;
    const state = states.get(field);
    if (state?.editor !== event.target || location.href !== url) syncFields();
    const current = states.get(field);
    if (current?.editor !== event.target) return;
    update(current, event.isTrusted);
    checkDrafts();
  }, true);
  function applySetting() {
    const next = settings.get().actionsUndoEnabled;
    if (next === enabled) return;
    enabled = next;
    if (enabled) {
      observer.observe(document, {subtree:true, childList:true, attributes:true, attributeFilter:['disabled','readonly','aria-disabled']});
      syncFields();
    } else {
      observer.disconnect();
      clearTimeout(timer);
      for (const state of states.values()) discard(state);
      states.clear();
    }
  }
  settings.ready.then(() => {
    settings.subscribe(applySetting);
    applySetting();
  }).catch(() => {});
}

function initSnippets({globalThis, api}) {
  const PREFIX = 'easitPlusSnippetV1:';
  const KEY = /^easitPlusSnippetV1:[a-f0-9-]{36}$/;
  const listeners = new Set();
  let records = {};
  const changedDuringLoad = new Set();
  let loaded = false;
  function normalize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ogiltig textmall.');
    const {name, text, trigger} = value;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) throw new Error('Ange ett namn med högst 100 tecken.');
    if (typeof text !== 'string' || !text.trim() || text.length > 20000) throw new Error('Ange malltext med högst 20 000 tecken.');
    if (typeof trigger !== 'string' || trigger.length < 2 || trigger.length > 80 || /\s/.test(trigger)) throw new Error('Triggern ska ha 2–80 tecken utan mellanslag.');
    return {name: name.trim(), text: text.replace(/\r\n?/g, '\n'), trigger};
  }
  function validate(data) {
    const entries = Object.entries(data).filter(([key]) => key.startsWith(PREFIX));
    if (entries.length > 200) throw new Error('Du kan spara högst 200 textmallar.');
    const triggers = [];
    const config=data.easitPlusSettingsV1,picker=config?.snippetPickerTrigger||'..';
    for (const [key, value] of entries) {
      if (!KEY.test(key)) throw new Error('Ogiltigt ID för textmall.');
      const item = normalize(value);
      if(config?.snippetPickerEnabled!==false&&(item.trigger.startsWith(picker)||picker.startsWith(item.trigger)))throw new Error('Mallens trigger krockar med mallväljarens trigger.');
      if (triggers.some(trigger => trigger.startsWith(item.trigger) || item.trigger.startsWith(trigger))) {
        throw new Error('Triggers får inte vara lika eller börja med en annan malls trigger.');
      }
      triggers.push(item.trigger);
    }
  }
  function emit() {listeners.forEach(listener => listener());}
  function readRecords(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (!KEY.test(key)) continue;
      try {result[key] = normalize(value);} catch { /* Ignore malformed local entries. */ }
    }
    return result;
  }
  api.changes.addListener((changes, area) => {
    if (area !== 'local') return;
    let changed = false;
    for (const [key, change] of Object.entries(changes)) {
      if (!key.startsWith(PREFIX)) continue;
      if (!loaded) changedDuringLoad.add(key);
      delete records[key];
      Object.assign(records, readRecords({[key]: change.newValue}));
      changed = true;
    }
    if (changed) emit();
  });
  const ready = api.local.get(null).then(data => {
    const initial = readRecords(data);
    for (const key of changedDuringLoad) {
      delete initial[key];
      if (records[key]) initial[key] = records[key];
    }
    records = initial; loaded = true; changedDuringLoad.clear(); emit();
  });
  globalThis.EasitPlusSnippets = {
    PREFIX, normalize, validate, ready,
    list: () => Object.entries(records).map(([id, item]) => ({id, ...item})).sort((a, b) => a.name.localeCompare(b.name, 'sv')),
    subscribe: listener => {listeners.add(listener); return () => listeners.delete(listener);},
    save: async (id, value) => {
      await ready;
      const item = normalize(value);
      const key = id || PREFIX + crypto.randomUUID();
      if (!KEY.test(key)) throw new Error('Ogiltigt ID för textmall.');
      const data = await api.local.get(null);
      validate({...data, [key]: item});
      await api.local.set({[key]: item});
      records[key] = item; emit();
      return key;
    },
    remove: async id => {
      if (!KEY.test(id)) throw new Error('Ogiltigt ID för textmall.');
      await api.local.remove(id);
      delete records[id]; emit();
    }
  };
}

function initSnippetUi({document, globalThis}) {
  if(globalThis.EasitPlusTemplateUI)return;
  const STYLE=`
    :host{all:initial!important;box-sizing:border-box!important;display:block!important;position:fixed!important;inset:auto!important;left:var(--easit-picker-left,8px)!important;top:var(--easit-picker-top,8px)!important;margin:0!important;width:min(350px,calc(100vw - 16px))!important;min-width:0!important;max-width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;height:auto!important;overflow-x:hidden!important;overflow-y:auto!important;padding:12px!important;border:1px solid var(--easit-plus-ui-border,var(--easit-plus-border-e2e8f0,#e2e8f0))!important;border-radius:var(--easit-plus-ui-radius,7.8125px)!important;background:var(--easit-plus-ui-surface,var(--easit-plus-surface-ffffff,#fff))!important;color:var(--easit-plus-ui-text,var(--easit-plus-text-253444,#253444))!important;font:13px/1.5 var(--easit-plus-ui-font,system-ui,sans-serif)!important;text-align:left!important;box-shadow:var(--easit-plus-ui-shadow,0 3.125px 15.625px #00000012)!important;z-index:2147483647!important;white-space:normal!important;pointer-events:auto!important;opacity:1!important;transform:none!important;zoom:1!important;}
    .picker{display:block;width:100%;min-width:0;animation:picker-enter var(--easit-plus-ui-enter,180ms) ease-out;}
    @keyframes picker-enter{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .picker button,.picker input{transition:background-color var(--easit-plus-ui-fast,140ms) ease,border-color var(--easit-plus-ui-fast,140ms) ease;}
    @media(prefers-reduced-motion:reduce){.picker{animation:none}.picker button,.picker input{transition:none}}

    .picker *{box-sizing:border-box;min-width:0;max-width:100%;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;}
    .picker h2{margin:0 0 10px;font-size:15px;font-weight:650;white-space:normal;}
    .picker input{display:block;width:100%;height:auto;margin:0 0 8px;padding:8px;border:1px solid var(--easit-plus-ui-control-border,var(--easit-plus-border-cbd5e1,#cbd5e1));border-radius:var(--easit-plus-ui-control-radius,6px);background:var(--easit-plus-ui-surface,var(--easit-plus-surface-ffffff,#fff));}
    .picker .easit-template-options{display:block;position:relative;max-height:240px;overflow-x:hidden;overflow-y:auto;margin:0;padding:0;}
    .picker .easit-template-options button{display:block;float:none;position:static;width:100%;height:auto;min-height:0;margin:0 0 4px;padding:8px 10px;text-align:left;white-space:normal;overflow-wrap:anywhere;border:1px solid var(--easit-plus-ui-control-border,var(--easit-plus-border-cbd5e1,#cbd5e1));border-radius:var(--easit-plus-ui-control-radius,6px);background:var(--easit-plus-ui-soft,var(--easit-plus-surface-f8fafc,#f8fafc));cursor:pointer;}
    .picker .easit-template-options button[aria-selected=true]{background:var(--easit-plus-ui-selected,var(--easit-plus-surface-dbe7ed,#dbe7ed));border-color:var(--easit-plus-ui-accent,var(--easit-plus-border-175a9b,#175a9b));}
    .picker strong{display:block;font-weight:650;white-space:normal;overflow-wrap:anywhere;}
    .picker small{display:block;font-size:11px;opacity:.8;white-space:pre-wrap;overflow-wrap:anywhere;}
    .picker p{display:block;margin:8px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;}
    .picker .easit-template-caption{font-size:11px;opacity:.8;}
    .picker :focus-visible{outline:2px solid var(--easit-plus-ui-accent,var(--easit-plus-border-175a9b,#175a9b));outline-offset:-2px;}
  `;
  function hostDocument(doc) {
    let current=doc;
    try {while(current.defaultView&&current.defaultView!==current.defaultView.parent){const parent=current.defaultView.parent.document;if(parent===current)break;current=parent;}}catch{}
    return current;
  }
  function element(doc,tag,text,className) {
    const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;
  }
  function pick(items,doc,anchor,choose,cancel=()=>{},editor=doc.activeElement) {
    items=[...items].sort((a,b)=>a.name.localeCompare(b.name,'sv'));
    const host=hostDocument(doc),view=host.defaultView;
    host.__easitPlusCloseTemplateUI?.('changed');
    const panel=element(host,'easit-plus-template-picker',undefined,'easit-template-ui easit-template-picker');
    const shadow=panel.attachShadow({mode:'open'}),sheet=new view.CSSStyleSheet(),body=element(host,'section',undefined,'picker');
    sheet.replaceSync(STYLE);shadow.adoptedStyleSheets=[sheet];shadow.append(body);
    panel.setAttribute('aria-label','Välj textmall');panel.setAttribute('data-easit-plus-addon','');panel.setAttribute('data-easit-plus-local-ui','');panel.contentEditable='false';
    const search=element(host,'input');search.type='search';search.placeholder='Sök mall…';search.setAttribute('aria-label','Sök textmall');search.setAttribute('role','combobox');search.setAttribute('aria-expanded','true');search.autocomplete='off';
    const list=element(host,'div',undefined,'easit-template-options');list.id='easit-template-options';list.setAttribute('role','listbox');search.setAttribute('aria-controls',list.id);
    const preview=element(host,'p','', 'easit-template-caption'),status=element(host,'p','');status.setAttribute('role','status');
    body.append(element(host,'h2','Välj textmall'),search,list,preview,element(host,'p','↑ ↓ Välj · Enter Infoga · Esc stänger och rensar triggern','easit-template-caption'),status);
    panel.dataset.pickerState='open';
    // Use the active native dialog and the popover top layer to avoid masks/clipping.
    let owner=editor;
    try {while(owner&&owner.ownerDocument!==host)owner=owner.ownerDocument.defaultView.frameElement;}catch{owner=null;}
    (owner?.closest('dialog[open]')||host.body||host.documentElement).append(panel);
    if(typeof panel.showPopover==='function'){panel.popover='manual';panel.showPopover();}
    let filtered=[],index=0,gone=false,committing=false;
    const windows=[...new Set([view,doc.defaultView])];
    const pointerEvents=['pointerdown','pointerup','mousedown','mouseup','click','dblclick','pointermove'];
    function close(reason='cancel') {
      if(gone)return;gone=true;
      for(const win of windows){win.removeEventListener('keydown',onKey,true);win.removeEventListener('beforeinput',onBeforeInput,true);for(const type of pointerEvents)win.removeEventListener(type,onPointer,true);}
      panel.remove();if(host.__easitPlusCloseTemplateUI===close)delete host.__easitPlusCloseTemplateUI;
      cancel(reason);
    }
    host.__easitPlusCloseTemplateUI=close;
    function select() {
      const item=filtered[index];if(!item||committing)return;
      // Native editor input belongs to insertion, never to the picker's search.
      committing=true;panel.dataset.pickerState='inserting';panel.dataset.selectCount=String(Number(panel.dataset.selectCount||0)+1);let inserted=false;
      try {inserted=choose(item)!==false;}catch(error){panel.dataset.errorName=error?.name||'Error';}
      finally{committing=false;}
      if(inserted){close('choose');return;}
      panel.dataset.pickerState='rejected';
      status.textContent='Textfältet har ändrats eller texten får inte plats. Stäng väljaren och försök igen.';
      search.focus({preventScroll:true});
    }
    function targetOf(event){return event.composedPath()[0]||event.target;}
    function inside(event){return event.composedPath().includes(panel);}
    function highlight(scroll=true) {
      [...list.children].forEach((row,i)=>row.setAttribute('aria-selected',String(i===index)));
      search.setAttribute('aria-activedescendant',filtered.length?`easit-template-option-${index}`:'');
      preview.textContent=filtered[index]?.text.slice(0,320)||'';
      const row=list.children[index];
      // Scroll only the options, never the page or the source editor.
      if(scroll&&row&&filtered.length){if(row.offsetTop<list.scrollTop)list.scrollTop=row.offsetTop;else if(row.offsetTop+row.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=row.offsetTop+row.offsetHeight-list.clientHeight;}
    }
    function render() {
      const query=search.value.toLocaleLowerCase('sv');filtered=items.filter(item=>`${item.name}\n${item.trigger}\n${item.text}`.toLocaleLowerCase('sv').includes(query));index=0;list.replaceChildren();status.textContent='';
      for(const[i,item]of filtered.entries()) {
        const row=element(host,'button');row.type='button';row.tabIndex=-1;row.id=`easit-template-option-${i}`;row.dataset.templateIndex=String(i);row.setAttribute('role','option');
        row.append(element(host,'strong',item.name),element(host,'small',item.trigger));list.append(row);
      }
      if(!filtered.length)list.append(element(host,'p','Inga matchande mallar.'));
      list.scrollTop=0;highlight(false);
    }
    function onKey(event) {
      if(gone||committing)return;
      const target=targetOf(event),inPicker=inside(event),source=!inPicker&&(editor===target||editor?.contains(target));
      if(!inPicker&&!source){close('outside');return;}
      panel.dataset.lastKey=event.key.length===1?'character':event.key;
      if(event.isComposing||event.keyCode===229)return;
      if(['ArrowDown','ArrowUp','Enter','Escape'].includes(event.key)) {
        event.preventDefault();event.stopImmediatePropagation();
        if(event.key==='Escape')close('cancel');
        else if(event.key==='Enter')select();
        else {if(filtered.length)index=(index+(event.key==='ArrowDown'?1:-1)+filtered.length)%filtered.length;highlight();}
      }else if(source) {
        if(event.ctrlKey||event.metaKey||event.altKey){close('outside');return;}
        if(event.key==='Tab'){event.preventDefault();event.stopImmediatePropagation();search.focus();}
        else if(event.key==='Backspace'){event.preventDefault();event.stopImmediatePropagation();search.value=Array.from(search.value).slice(0,-1).join('');render();}
        else if(event.key.length===1){event.preventDefault();event.stopImmediatePropagation();search.value+=event.key;render();}
        else close('outside');
      }else event.stopImmediatePropagation();
    }
    function onPointer(event) {
      if(gone||committing)return;
      if(!inside(event)){if(event.type==='pointerdown')close('outside');return;}
      panel.dataset.lastPointer=event.type;
      event.stopImmediatePropagation();
      const row=targetOf(event).closest?.('button[data-template-index]');
      if(!row)return;
      if(event.type==='pointerdown'||event.type==='mousedown')event.preventDefault();
      if(event.type==='pointermove'){index=Number(row.dataset.templateIndex);highlight(false);}
      if(event.type==='click'){event.preventDefault();index=Number(row.dataset.templateIndex);select();}
    }
    function onBeforeInput(event) {
      if(gone||committing||inside(event)||!(event.target===editor||editor?.contains(event.target)))return;
      if(event.inputType==='insertText'&&event.cancelable&&!event.isComposing&&typeof event.data==='string') {
        event.preventDefault();event.stopImmediatePropagation();search.value+=event.data;render();
      }else close('outside');
    }
    search.addEventListener('input',event=>{event.stopPropagation();panel.dataset.inputCount=String(Number(panel.dataset.inputCount||0)+1);render();});
    panel.style.setProperty('--easit-picker-left','8px');panel.style.setProperty('--easit-picker-top','8px');render();let x=anchor.left,y=anchor.bottom;
    try {let current=doc;while(current!==host){const frame=current.defaultView.frameElement,r=frame.getBoundingClientRect();x+=r.left;y+=r.top;current=frame.ownerDocument;}}catch{}
    panel.style.setProperty('--easit-picker-left',`${Math.max(8,Math.min(x,view.innerWidth-panel.offsetWidth-8))}px`);
    panel.style.setProperty('--easit-picker-top',`${Math.max(8,Math.min(y+6,view.innerHeight-panel.offsetHeight-8))}px`);
    for(const win of windows){win.addEventListener('keydown',onKey,true);win.addEventListener('beforeinput',onBeforeInput,true);for(const type of pointerEvents)win.addEventListener(type,onPointer,true);}
    // Keep the editor's native focus/selection until an explicit search click/Tab.
    return close;
  }
  globalThis.EasitPlusTemplateUI={pick};
}

function initSnippetExpander({document, globalThis, Node}) {
  const snippets = globalThis.EasitPlusSnippets;
  if (!snippets) return;
  let templates = [];
  let maxLength = 0;
  let replacing = false;
  let closeUI = null;
  const settings=globalThis.EasitPlusSettings,ui=globalThis.EasitPlusTemplateUI;
  function refresh() {maxLength=Math.max(settings?.get().snippetPickerTrigger.length||0,0,...templates.map(item=>item.trigger.length));closeUI?.('changed');closeUI=null;}
  function readTemplates() {
    templates = snippets.list().sort((a, b) => b.trigger.length - a.trigger.length);
    refresh();
  }
  snippets.subscribe(readTemplates);readTemplates();
  settings?.subscribe(refresh);
  snippets.ready.then(readTemplates).catch(() => {});
  const BLOCK = 'p,div,li,pre,blockquote,td,th,h1,h2,h3,h4,h5,h6';
  function match(text) {
    return templates.find(item => {
      if (!text.endsWith(item.trigger)) return false;
      const index = text.length - item.trigger.length;
      return index === 0 || /\s|[([{\u0022']/.test(text[index - 1]);
    });
  }
  function find(text) {
    const item=match(text);if(item)return {item,trigger:item.trigger};
    const config=settings?.get(),trigger=config?.snippetPickerTrigger;
    if(!config?.snippetPickerEnabled||!trigger||!text.endsWith(trigger)||templates.some(item=>item.trigger.startsWith(trigger)||trigger.startsWith(item.trigger)))return null;
    const index=text.length-trigger.length;
    return index===0||/\s|[([{\u0022']/.test(text[index-1])?{picker:true,trigger}:null;
  }
  function field(target) {
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    if (!element || element.closest('[data-easit-plus-local-ui], [data-easit-plus-addon], [inert], [contenteditable="false"]')) return null;
    if (element.matches('textarea, input')) {
      if (element.disabled || element.readOnly) return null;
      if (element.tagName === 'INPUT' && !['text', 'search', 'url', 'tel', 'email'].includes(element.type)) return null;
      return element;
    }
    // CKEditor-style mail windows can make the entire iframe editable.
    if (element.ownerDocument.designMode.toLowerCase() === 'on') return element.ownerDocument.body;
    if (!element.isContentEditable) return null;
    let root = element;
    while (root.parentElement?.isContentEditable) root = root.parentElement;
    return root;
  }
  function richContext(editor) {
    const selection = editor.ownerDocument.getSelection();
    if (!selection?.isCollapsed || !selection.rangeCount || !editor.contains(selection.anchorNode)) return null;
    const caret = selection.getRangeAt(0);
    const parent = caret.startContainer.nodeType === 1 ? caret.startContainer : caret.startContainer.parentElement;
    const closest = parent.closest(BLOCK);
    const block = closest && editor.contains(closest) ? closest : editor;
    const before = caret.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(caret.startContainer, caret.startOffset);
    // Range.toString omits hard line breaks. Track them explicitly so a trigger
    // after Shift+Enter works, while a trigger split across lines never matches.
    const walker = editor.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    const nodes = [];
    let text = '';
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (before.comparePoint(node, 0) > 0) break;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('br,' + BLOCK + ',[contenteditable="false"],input,textarea,select,script,style')) {nodes.length = 0; text = '';}
        continue;
      }
      const ancestor = node.parentElement.closest(BLOCK);
      const textBlock = ancestor && editor.contains(ancestor) ? ancestor : editor;
      if (node.parentElement.closest('[contenteditable="false"],input,textarea,select,script,style') || textBlock !== block) {
        nodes.length = 0; text = ''; continue;
      }
      const end = node === caret.startContainer ? caret.startOffset : node.length;
      if (end) {
        nodes.push({node, end});
        text = (text + node.data.slice(Math.max(0, end - maxLength - 1), end)).slice(-maxLength - 1);
      }
    }
    const found = find(text);
    if (!found) return null;
    // Map the literal suffix back to DOM text nodes, including split inline formatting.
    let remaining = found.trigger.length;
    const range = caret.cloneRange();
    for (let index = nodes.length - 1; index >= 0; index--) {
      const {node, end} = nodes[index];
      if (remaining <= end) {range.setStart(node, end - remaining); remaining = 0; break;}
      remaining -= end;
    }
    if (remaining || range.toString() !== found.trigger) return null;
    // Never replace through paragraph boundaries, embedded controls, or protected content.
    if (range.cloneContents().querySelector('br,p,div,li,[contenteditable="false"],input,textarea,select')) return null;
    const prefix=range.cloneRange();prefix.selectNodeContents(editor);prefix.setEnd(range.startContainer,range.startOffset);
    return {selection,range,rangeOffset:prefix.toString().length,richText:editor.textContent,...found};
  }
  function recoverRange(context) {
    const {editor,range,trigger,rangeOffset,richText}=context;
    if(editor.contains(range.commonAncestorContainer)&&range.toString()===trigger)return true;
    // CKEditor/ZK may replace text nodes on blur/focus without changing the text.
    // Rebuild the exact logical bookmark only when the whole source text matches.
    if(editor.textContent!==richText||!Number.isSafeInteger(rangeOffset))return false;
    const walker=editor.ownerDocument.createTreeWalker(editor,NodeFilter.SHOW_TEXT),next=editor.ownerDocument.createRange();
    const end=rangeOffset+trigger.length;let offset=0,started=false,finished=false;
    for(let node=walker.nextNode();node;node=walker.nextNode()) {
      if(!started&&rangeOffset<=offset+node.length){next.setStart(node,rangeOffset-offset);started=true;}
      if(started&&end<=offset+node.length){next.setEnd(node,end-offset);finished=true;break;}
      offset+=node.length;
    }
    if(!finished||next.toString()!==trigger)return false;
    const protectedSelector='[contenteditable="false"],input,textarea,select,script,style';
    if(next.startContainer.parentElement.closest(protectedSelector)||next.endContainer.parentElement.closest(protectedSelector)||next.cloneContents().querySelector('br,p,div,li,'+protectedSelector))return false;
    context.range=next;return true;
  }
  function valid(context) {
    const {editor}=context;if(!editor.isConnected||field(editor)!==editor)return false;
    try {let view=editor.ownerDocument.defaultView;while(view&&view!==view.parent){if(!view.frameElement?.isConnected)return false;view=view.parent;}}catch{return false;}
    return context.range?recoverRange(context):editor.value===context.value;
  }
  function insert(context,value) {
    if(!valid(context))return false;
    const {editor}=context,wasReplacing=replacing;replacing=true;
    try {
      if (editor.matches('textarea, input')) {
        const {start,end}=context;
        const text = editor.tagName === 'INPUT' ? value.replace(/\n/g, ' ') : value;
        if (editor.maxLength >= 0 && editor.value.length - context.trigger.length + text.length > editor.maxLength) return false;
        const scrollTop = editor.scrollTop;
        // Native editing preserves the browser's editing events and undo history.
        editor.focus();if(!valid(context))return false;editor.setSelectionRange(start, end);
        if (!editor.ownerDocument.execCommand('insertText', false, text)) {
          editor.setRangeText(text, start, end, 'end');
          editor.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertReplacementText', data: text}));
        }
        editor.scrollTop = scrollTop;
        return true;
      } else {
        editor.focus();if(!valid(context))return false;const selection=editor.ownerDocument.getSelection();
        const original = selection.rangeCount?selection.getRangeAt(0).cloneRange():null;
        selection.removeAllRanges();selection.addRange(context.range);
        // Encode user text before inserting line breaks. This avoids the extra
        // paragraph spacing insertText creates in paragraph-based rich editors.
        const plain = editor.ownerDocument.createElement('div');
        plain.textContent = value;
        const isPlain = editor.contentEditable === 'plaintext-only';
        const command = isPlain ? 'insertText' : 'insertHTML';
        const html = isPlain ? value : plain.innerHTML.replace(/\n/g, '<br>');
        if (!editor.ownerDocument.execCommand(command, false, html)) {
          selection.removeAllRanges();if(original)selection.addRange(original);return false;
        }
        return true;
      }
    } finally {replacing = wasReplacing;}
  }
  function expand(target) {
    if(replacing||closeUI)return;
    const editor=field(target);
    if(!editor||!(editor===editor.ownerDocument.activeElement||editor.contains(editor.ownerDocument.activeElement)))return;
    let context;
    if(editor.matches('textarea,input')){
      const end=editor.selectionEnd;if(end===null||editor.selectionStart!==end)return;
      const found=find(editor.value.slice(Math.max(0,end-maxLength-1),end));if(!found)return;
      context={editor,...found,start:end-found.trigger.length,end,value:editor.value};
    }else{const found=richContext(editor);if(!found)return;context={editor,...found};}
    if(context.picker&&ui){const anchor=context.range?.getBoundingClientRect()||editor.getBoundingClientRect();closeUI=ui.pick(templates,editor.ownerDocument,anchor,item=>insert(context,item.text),reason=>{closeUI=null;if(reason==='cancel')insert(context,'');},editor);}
    else if(context.item)insert(context,context.item.text);
  }
  const bindingKey = '__easitPlusSnippetBindingV2';
  globalThis.EasitPlusDocuments.watch(doc=>{
    // Both the parent observer and the userscript running in that frame may reach a
    // document. Share one listener set so replacement/undo happens only once.
    if (doc[bindingKey]) {doc[bindingKey].users++;}
    else {
      const input = event=>{
        if (event.isComposing || event.inputType !== 'insertText') return;
        expand(event.target);
      };
      const composition = event=>expand(event.target);
      const keyup = event=>{
        if (event.isComposing || event.keyCode === 229 || event.ctrlKey || event.altKey || event.metaKey || event.key?.length !== 1) return;
        expand(event.target);
      };
      doc[bindingKey] = {users:1,bind:()=>{
        doc.addEventListener('input',input,true); doc.addEventListener('compositionend',composition,true); doc.addEventListener('keyup',keyup,true);
      },cleanup:()=>{
        doc.removeEventListener('input',input,true); doc.removeEventListener('compositionend',composition,true); doc.removeEventListener('keyup',keyup,true);
      }};
    }
    doc[bindingKey].bind();
    return ()=>{const binding = doc[bindingKey]; if (binding && --binding.users === 0) {binding.cleanup(); delete doc[bindingKey];}};
  });
}

/* Run before CSS/body paint; embedded popups reveal only after initialization. */
function initPopupStart({window, document, globalThis, postToHeader}) {
  const embedded = window !== window.top, origin = 'https://sjalvservice-it.norrkoping.se';
  if (embedded) document.documentElement.dataset.embedded = 'true';
  const jobs = [];
  const flushTheme = () => {try {globalThis.EasitPlusTheme?.flush();} catch { /* Keep the popup usable if theme application fails. */ }};
  const ready = new Promise(resolve => queueMicrotask(async () => {
    await Promise.allSettled([globalThis.EasitPlusSettings?.ready, globalThis.EasitPlusTheme?.ready, ...jobs]);
    flushTheme();
    document.documentElement.dataset.popupReady = 'true';
    resolve();
    if (embedded) postToHeader({type:'easit-plus-popup-loaded'}, origin);
  }));
  globalThis.EasitPlusPopupStartup = {ready, track: promise => {jobs.push(promise); return promise;}};
  if (embedded) window.addEventListener('pagehide', () => postToHeader({type:'easit-plus-popup-loading'}, origin));
  if (embedded) window.addEventListener('message', async event => {
    if (event.source !== window.parent || event.origin !== origin || event.data?.type !== 'easit-plus-popup-prepare' || !Number.isSafeInteger(event.data.requestId) || event.data.requestId <= 0) return;
    const requestId = event.data.requestId;
    await ready;
    // A cached hidden frame can have a pending animation frame. Flush before showing.
    flushTheme();
    postToHeader({type:'easit-plus-popup-ready', requestId}, origin);
  });
}

function initLoadHistory({globalThis, api}) {
  const KEY='easitPlusLoadHistoryV1',LIMIT=500;
  function normalize(value) {
    const unique=new Map();
    for(const item of Array.isArray(value)?value:[]) {
      if(!item||typeof item.id!=='string'||item.id.length>200||!Number.isFinite(item.startedAt)||!Number.isFinite(item.endedAt)||item.startedAt<=0||item.endedAt<item.startedAt||item.endedAt>8640000000000000||!['network','icon'].includes(item.source))continue;
      unique.set(item.id,{id:item.id,startedAt:item.startedAt,endedAt:item.endedAt,durationMs:Math.round(item.endedAt-item.startedAt),source:item.source});
    }
    return [...unique.values()].sort((a,b)=>a.endedAt-b.endedAt||a.startedAt-b.startedAt||a.id.localeCompare(b.id)).slice(-LIMIT);
  }
  function stats(items) {
    const values=normalize(items).map(item=>item.durationMs).sort((a,b)=>a-b),n=values.length;
    return {count:n,median:n?(values[Math.floor((n-1)/2)]+values[Math.floor(n/2)])/2:null,longest:n?values[n-1]:null};
  }
  const seconds=value=>value===null?'—':`${(value/1000).toLocaleString('sv-SE',{minimumFractionDigits:1,maximumFractionDigits:1})} s`;
  const date=value=>new Date(value).toLocaleString('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  function format(items) {
    const entries=normalize(items),s=stats(entries);
    return `Laddningshistorik Easit+\nAntal: ${s.count}\nMedian: ${seconds(s.median)}\nLängsta laddtid: ${seconds(s.longest)}\n\nDatum\tLaddtid\tMätning\n`+entries.map(item=>`${date(item.startedAt)}\t${seconds(item.durationMs)}\t${item.source==='icon'?'Laddsymbol':'Nätanrop'}`).join('\n');
  }
  function select(items,seconds=0) {
    const minimum=(Number.isFinite(seconds)&&seconds>=0&&seconds<=300&&Math.round(seconds*10)/10===seconds?seconds:0)*1000;
    return normalize(items).filter(item=>minimum===0||item.endedAt-item.startedAt>minimum);
  }
  async function record(finished,source) {
    const data=await api.local.get(KEY),items=normalize(data[KEY]);
    const id=finished.id+'@'+finished.startedAt;
    if(items.some(item=>item.id===id))return;
    const next=normalize([...items,{...finished,id,source:source==='icon'?'icon':'network'}]);
    await api.local.set({[KEY]:next});
  }
  globalThis.EasitPlusLoadHistory={KEY,LIMIT,normalize,stats,seconds,date,format,select,record};
}

function initThemePresets({globalThis, api}) {
  const PREFIX='easitPlusThemeV1:';
  const keys=['themeEnabled','themeColor','secondaryThemeEnabled','secondaryThemeColor','secondaryThemeTextMode','snowfallEnabled'];
  const records=new Map(),touched=new Set(),listeners=new Set();
  const emit=()=>listeners.forEach(listener=>listener());
  function normalize(value) {
    if(!value||typeof value!=='object')throw new Error('Ogiltigt tema.');
    const result={};
    for(const key of ['themeEnabled','secondaryThemeEnabled']) {
      if(typeof value[key]!=='boolean')throw new Error('Ogiltigt tema.');
      result[key]=value[key];
    }
    for(const key of ['themeColor','secondaryThemeColor']) {
      result[key]=globalThis.EasitPlusSettings.normalizeColor(value[key]);
      if(!result[key])throw new Error('Ogiltig färgkod i tema.');
    }
    if(value.secondaryThemeTextMode!==undefined&&!['auto','black','white'].includes(value.secondaryThemeTextMode))throw new Error('Ogiltig textfärg i tema.');
    if(value.snowfallEnabled!==undefined&&typeof value.snowfallEnabled!=='boolean')throw new Error('Ogiltigt snöfall i tema.');
    result.snowfallEnabled=value.snowfallEnabled===true;
    result.secondaryThemeTextMode='auto';
    return result;
  }
  const validKey=key=>/^easitPlusThemeV1:[a-f0-9-]{36}$/i.test(key);
  function receive(key,value) {
    records.delete(key);
    try {if(validKey(key)&&value)records.set(key,normalize(value));}catch {/* Ogiltiga lagrade teman visas inte. */}
  }
  api.changes.addListener((changes,area)=>{
    if(area!=='local')return;
    let changed=false;
    for(const [key,value]of Object.entries(changes))if(key.startsWith(PREFIX)) {
      touched.add(key);receive(key,value.newValue);changed=true;
    }
    if(changed)emit();
  });
  const ready=api.local.get(null).then(data=>{
    for(const [key,value]of Object.entries(data))if(key.startsWith(PREFIX)&&!touched.has(key))receive(key,value);
    emit();
  });
  globalThis.EasitPlusThemes={PREFIX,keys,normalize,validKey,ready,
    list:()=>[...records].map(([key,value])=>({key,...value})),
    subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
    save:async (settings,{activate=false,key=null}={})=>{
      await ready;
      const value=normalize(Object.fromEntries(keys.map(key=>[key,settings[key]])));
      if(key!==null&&(!validKey(key)||!records.has(key)))throw new Error('Temat finns inte längre.');
      key??=PREFIX+crypto.randomUUID();
      await api.local.set({[key]:value,...(activate?{easitPlusSettingsV1:globalThis.EasitPlusSettings.normalize({...settings,...value})}:{})});
      receive(key,value);emit();
    },
    remove:async key=>{
      if(!validKey(key))throw new Error('Ogiltigt tema.');
      await api.local.remove(key);records.delete(key);emit();
    },
    values:value=>{const normalized=normalize(value);return Object.fromEntries(keys.map(key=>[key,normalized[key]]));}
  };
}

function initBackup({globalThis, api}) {
  const SETTINGS='easitPlusSettingsV1';
  function normalizeData(input) {
    if(input?.format==='easit-plus-backup' && input.version!==1)throw new Error('Okänt säkerhetskopieformat');
    const source=input?.format==='easit-plus-backup'?input.data:input;
    if(!source || typeof source!=='object' || Array.isArray(source))throw new Error('Ogiltig säkerhetskopia');
    const result={};
    for(const [key,value]of Object.entries(source)) {
      if(key===SETTINGS) {
        if(!value || typeof value!=='object')throw new Error('Ogiltiga inställningar');
        const settings=globalThis.EasitPlusSettings.defaults();
        for(const flag of Object.keys(settings).filter(key=>typeof settings[key]==='boolean')) {
          if(value[flag]!==undefined && typeof value[flag]!=='boolean')throw new Error('Ogiltig inställning');
          if(typeof value[flag]==='boolean')settings[flag]=value[flag];
        }
        settings.mailUnreadEnabled=globalThis.EasitPlusSettings.normalize(value).mailUnreadEnabled;
        for(const key of ['mailSendReadEnabled','mailCloseReadEnabled']){
          if(value[key]!==undefined&&typeof value[key]!=='boolean')throw new Error('Ogiltig inställning');
          if(typeof value[key]==='boolean')settings[key]=value[key];
        }
        for(const colorKey of ['themeColor','secondaryThemeColor']) {
          if(value[colorKey]===undefined)continue;
          const color=globalThis.EasitPlusSettings.normalizeColor(value[colorKey]);
          if(!color)throw new Error('Ogiltig färgkod');
          settings[colorKey]=color;
        }
        if(value.secondaryThemeTextMode!==undefined && !['auto','black','white'].includes(value.secondaryThemeTextMode))throw new Error('Ogiltigt textfärgsläge');
        settings.secondaryThemeTextMode='auto';
        settings.secondaryThemeWhiteText=globalThis.EasitPlusSettings.textIsWhite(settings.secondaryThemeTextMode,settings.secondaryThemeColor);
        if(value.snippetPickerTrigger!==undefined){if(typeof value.snippetPickerTrigger!=='string'||!/^\S{2,20}$/.test(value.snippetPickerTrigger))throw new Error('Ogiltig trigger för mallväljaren');settings.snippetPickerTrigger=value.snippetPickerTrigger;}
        if(value.loadingDismissSeconds!==undefined){if(!Number.isInteger(value.loadingDismissSeconds)||value.loadingDismissSeconds<1||value.loadingDismissSeconds>300)throw new Error('Ogiltig notistid');settings.loadingDismissSeconds=value.loadingDismissSeconds;}
        for(const key of ['loadingShowAfterSeconds']) {
          if(value[key]===undefined)continue;
          if(!Number.isFinite(value[key])||value[key]<0||value[key]>300||Math.round(value[key]*10)/10!==value[key])throw new Error('Ogiltig tidsgräns');
          settings[key]=value[key];
        }
        settings.copyEnabled = settings.unreadEnabled = true;
        result[key]=settings;
      } else if(key.startsWith('easitPlusThemeV1:')) {
        if(!globalThis.EasitPlusThemes?.validKey(key))throw new Error('Ogiltigt tema-ID');
        result[key]=globalThis.EasitPlusThemes.normalize(value);
      } else if(key==='easitPlusFirstLineExcludedV1') {
        if(!Array.isArray(value)||value.length>500||value.some(name=>typeof name!=='string'||!name.trim()||name.length>200))throw new Error('Ogiltiga exkluderade handläggare');
        result[key]=[...new Map(value.map(name=>{const label=name.normalize('NFC').replace(/\s+/g,' ').trim();return [label.toLocaleLowerCase('sv'),label];})).values()];
      } else if(key==='easitPlusFirstLineExcludedTodayV1') {
        if(!Array.isArray(value)||value.length>500||value.some(item=>typeof item?.name!=='string'||!item.name.trim()||item.name.length>200||!Number.isSafeInteger(item.until)||item.until<=0||item.until>8640000000000000))throw new Error('Ogiltiga tillfälligt exkluderade handläggare');
        result[key]=[...new Map(value.filter(item=>item.until>Date.now()).map(item=>{const name=item.name.normalize('NFC').replace(/\s+/g,' ').trim();return [name.toLocaleLowerCase('sv'),{name,until:item.until}];})).values()];
      } else if(key.startsWith(globalThis.EasitPlusSnippets.PREFIX)) {
        result[key]=globalThis.EasitPlusSnippets.normalize(value);
      } else if(key.startsWith('easitPlusTicketV1:')) {
        const record=globalThis.EasitPlusTickets.normalize(value);
        if(!record || globalThis.EasitPlusTickets.keyFor(record.id)!==key)throw new Error('Ogiltiga ärendeuppgifter');
        result[key]=record;
      } else if(key==='easitPlusDefaultsV2') {if(value===true)result[key]=true;}
      else if(/^easitPlusGroupingTableV1:[a-f0-9]{1,16}$/.test(key)) {
        if(typeof value!=='boolean')throw new Error('Ogiltigt tabellval');result[key]=value;
      } else if(/^easitPlusCollapsedGroupV1:[a-f0-9]{1,16}:.+$/.test(key)) {
        if(key.length>2000||value!==true)throw new Error('Ogiltigt kollapsläge');
        try{decodeURIComponent(key.slice(key.indexOf(':',key.indexOf(':')+1)+1));}catch{throw new Error('Ogiltig statusgrupp');}
        result[key]=true;
      } else if(/^easitPlus(Pin|Note)V1:.+/.test(key)) {
        const suffix=key.slice(key.indexOf(':')+1);if(suffix.length>1000)throw new Error('Ogiltigt ärende-ID');
        try{decodeURIComponent(suffix);}catch{throw new Error('Ogiltigt ärende-ID');}
        if(key.startsWith('easitPlusPinV1:')) {if(value!==true)throw new Error('Ogiltig fästning');result[key]=true;}
        else if(key.startsWith('easitPlusNoteV1:')) {
          const note=globalThis.EasitPlusNotes.normalize(value,{strict:true});
          if(note)result[key]=note;
        }
      }
    }
    globalThis.EasitPlusSnippets.validate(result);
    if(!Object.keys(result).length)throw new Error('Inga Easit+-uppgifter hittades');
    result.easitPlusDefaultsV2=true;
    return result;
  }
  async function exportData() {
    await globalThis.EasitPlusSettings.ready;
    const data=normalizeData(await api.local.get(null));
    return {format:'easit-plus-backup',version:1,scriptVersion:VERSION,exportedAt:new Date().toISOString(),data};
  }
  async function importData(input) {
    await globalThis.EasitPlusSettings.ready;
    const data=normalizeData(input);
    globalThis.EasitPlusSnippets.validate({...await api.local.get(null),...data});
    await api.local.set(data);
    return Object.keys(data).filter(key=>/^easitPlus(Pin|Note|Snippet)V1:/.test(key)).length;
  }
  globalThis.EasitPlusBackup={normalizeData,exportData,importData};
}

function initSnippetPopup({document, globalThis}) {
  const snippets = globalThis.EasitPlusSnippets;
  const list = document.getElementById('snippetList');
  const form = document.getElementById('snippetForm');
  const dialog = document.getElementById('snippetDialog');
  const errorMessage = document.getElementById('snippetFormError');
  const message = document.getElementById('snippetMessage');
  const name = document.getElementById('snippetName');
  const trigger = document.getElementById('snippetTrigger');
  const text = document.getElementById('snippetText');
  const search = document.getElementById('snippetSearch');
  let editingId = null;
  let busy = false;
  function close() {if (!busy) dialog.close();}
  dialog.addEventListener('close', () => {editingId = null; form.reset(); errorMessage.textContent = '';});
  dialog.addEventListener('cancel', event => {if (busy) event.preventDefault();});
  function edit(item) {
    if (busy) return;
    editingId = item?.id || null;
    form.reset();
    name.value = item?.name || '';
    trigger.value = item?.trigger || '';
    text.value = item?.text || '';
    document.getElementById('snippetFormTitle').textContent = item ? 'Redigera mall' : 'Ny mall';
    errorMessage.textContent = '';
    dialog.showModal();
    message.textContent = '';
    name.focus();
  }
  function button(label, title, action) {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = label; element.title = title;
    element.setAttribute('aria-label', title); element.disabled = busy;
    element.addEventListener('click', action);
    return element;
  }
  function render() {
    list.replaceChildren();
    const all = snippets.list();
    const terms = search.value.trim().toLocaleLowerCase('sv').split(/\s+/).filter(Boolean);
    const items = all.filter(item => {const value=[item.name,item.trigger,item.text].join(' ').toLocaleLowerCase('sv');return terms.every(term=>value.includes(term));});
    document.getElementById('snippetCount').textContent = terms.length ? `(${items.length}/${all.length})` : `(${all.length})`;
    if (!items.length) {
      const empty = document.createElement('li'); empty.className = 'hint';
      empty.textContent = all.length ? 'Inga textmallar matchar sökningen.' : 'Inga mallar.'; list.append(empty);
    }
    for (const item of items) {
      const row = document.createElement('li'); row.className = 'snippet-row';
      const heading = document.createElement('div'); heading.className = 'snippet-heading';
      const title = document.createElement('strong'); title.textContent = item.name;
      const code = document.createElement('code'); code.textContent = item.trigger;
      heading.append(title, code);
      const preview = document.createElement('p'); preview.className = 'snippet-preview';
      preview.textContent = item.text.slice(0, 180); preview.title = item.text;
      const actions = document.createElement('div'); actions.className = 'buttons';
      actions.append(
        button('Kopiera', `Kopiera ${item.name}`, async () => {
          try {await globalThis.EasitPlusFeedback.copyText(item.text);message.textContent='';}
          catch {message.textContent='Kunde inte kopiera. Försök igen.';}
        }),
        button('Redigera', `Redigera ${item.name}`, () => edit(item)),
        button('Ta bort', `Ta bort ${item.name}`, async () => {
          if (busy) return;
          busy = true; render();
          try {await snippets.remove(item.id); if (editingId === item.id) close(); message.textContent = 'Borttagen.';}
          catch {message.textContent = 'Kunde inte ta bort mallen.';}
          finally {busy = false; render();}
        })
      );
      row.append(heading, preview, actions); list.append(row);
    }
  }
  search.addEventListener('input', render);
  search.addEventListener('keydown', event => {
    if(event.key!=='Escape'||!search.value)return;
    event.preventDefault();event.stopPropagation();search.value='';render();
  });
  document.getElementById('newSnippet').addEventListener('click', () => edit(null));
  document.getElementById('cancelSnippet').addEventListener('click', close);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    form.querySelector('fieldset').disabled = true; render();
    try {
      await snippets.save(editingId, {name: name.value, trigger: trigger.value, text: text.value});
      dialog.close(); message.textContent = 'Sparad.';
    } catch (error) {errorMessage.textContent = error.message || 'Kunde inte spara mallen.';}
    finally {busy = false; form.querySelector('fieldset').disabled = false; render();}
  });
  snippets.subscribe(render);
  const initialReady = snippets.ready.then(() => {render(); document.getElementById('newSnippet').disabled = false;})
    .catch(() => {message.textContent = 'Kunde inte läsa mallarna. Öppna Easit+ igen.';});
  globalThis.EasitPlusPopupStartup?.track(initialReady);
}

function initColorPicker({document, globalThis, Event}) {
  const byId = id => document.getElementById(id);
  const dialog = byId('colorDialog'), code = byId('colorCode'), format = byId('colorFormat');
  const plane = byId('colorPlane'), hue = byId('colorHue');
  const saturation = byId('colorSaturation'), brightness = byId('colorBrightness');
  const error = byId('colorError');
  const swatches = ['themeColor', 'secondaryThemeColor'].map(byId);
  let active = null, h = 0, s = 0, v = 1, color = '#ffffff';

  function channels(hex) {return hex.slice(1).match(/../g).map(part => parseInt(part, 16));}
  function toHSV(hex) {
    const [r, g, b] = channels(hex).map(n => n / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    // Keep the current hue for grey/black, so increasing saturation is predictable.
    if (d) h = ((max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360;
    s = max ? d / max : 0; v = max;
  }
  function fromHSV() {
    const c = v * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = v - c;
    const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
    return '#' + rgb.map(n => Math.round((n + m) * 255).toString(16).padStart(2, '0')).join('');
  }
  function parseCode() {
    if (format.value === 'hex') return globalThis.EasitPlusSettings.normalizeColor(code.value);
    const match = code.value.trim().match(/^(?:rgb\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
    if (!match || match.slice(1).some(n => Number(n) > 255)) return null;
    // Require balanced rgb(...) syntax when a function wrapper is used.
    if (/^rgb/i.test(code.value.trim()) !== /\)$/.test(code.value.trim())) return null;
    return '#' + match.slice(1).map(n => Number(n).toString(16).padStart(2, '0')).join('');
  }
  function clearError() {code.removeAttribute('aria-invalid'); error.textContent = '';}
  function render(updateCode = true) {
    hue.value = h; saturation.value = s * 100; brightness.value = v * 100;
    plane.style.setProperty('--picker-hue', `hsl(${h} 100% 50%)`);
    byId('colorCursor').style.left = `${s * 100}%`;
    byId('colorCursor').style.top = `${(1 - v) * 100}%`;
    byId('colorPreview').style.backgroundColor = color;
    if (updateCode) {code.value = format.value === 'rgb' ? channels(color).join(', ') : color; clearError();}
    code.placeholder = format.value === 'rgb' ? '45, 138, 179' : '#2d8ab3';
  }
  function refresh() {
    for (const swatch of swatches) swatch.style.setProperty('--swatch-color', swatch.value);
    if (dialog.open && active) {
      if (active.disabled) {dialog.close(); return;}
      // Saving a preview must not rewrite a partially entered code or move the caret.
      if (active.value !== color) {color = active.value; toHSV(color); render();}
    }
  }
  function commit(next, updateCode = true) {
    if (!active || active.disabled || !next) return;
    color = next; active.value = color;
    render(updateCode); refresh();
    active.dispatchEvent(new Event('input', {bubbles: true}));
  }
  function validateCode(report = false) {
    const next = parseCode();
    if (!next) {
      if (report) {code.setAttribute('aria-invalid', 'true'); error.textContent = format.value === 'rgb' ? 'Ange R, G, B från 0 till 255.' : 'Ange en hexkod, till exempel #2d8ab3.';}
      return false;
    }
    clearError(); toHSV(next); commit(next, false); return true;
  }
  for (const swatch of swatches) {
    swatch.addEventListener('click', () => {
      active = swatch; color = swatch.value; h = 0; toHSV(color);
      byId('colorTitle').textContent = byId(swatch.getAttribute('aria-labelledby')).textContent;
      render(); dialog.showModal(); code.focus(); code.select();
    });
    swatch.addEventListener('input', refresh);
  }
  code.addEventListener('input', () => {clearError(); validateCode();});
  code.addEventListener('change', () => validateCode(true));
  code.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault(); if (validateCode(true)) dialog.close();
  });
  // Switching format changes only the representation, never the selected color.
  format.addEventListener('change', () => render());
  for (const control of [hue, saturation, brightness]) control.addEventListener('input', () => {
    h = Number(hue.value); s = Number(saturation.value) / 100; v = Number(brightness.value) / 100;
    commit(fromHSV());
  });
  function pick(event) {
    const rect = plane.getBoundingClientRect();
    s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    commit(fromHSV());
  }
  plane.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); plane.setPointerCapture(event.pointerId); pick(event);
  });
  plane.addEventListener('pointermove', event => {if (plane.hasPointerCapture(event.pointerId)) pick(event);});
  plane.addEventListener('pointerup', event => {if (plane.hasPointerCapture(event.pointerId)) plane.releasePointerCapture(event.pointerId);});
  byId('chooseColor')?.addEventListener('click',()=>{if(validateCode(true))dialog.close();});
  byId('closeColor').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {const previous = active; active = null; previous?.focus();});
  globalThis.EasitPlusColorPicker = {refresh};
}

function initPopup({window, document, globalThis, api, postToHeader, reloadPopup}) {
  if (window !== window.top) {
    document.documentElement.dataset.embedded = 'true';
    window.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open],#ticketMenu:not([hidden]),#themeMenu:not([hidden])')) return;
      event.preventDefault();
      postToHeader({type:'easit-plus-popup-close'}, 'https://sjalvservice-it.norrkoping.se');
    });
  }
  document.querySelector('#versionLabel').textContent = `Version ${VERSION}`;
  const settings = globalThis.EasitPlusSettings;
  const fields = document.querySelector('#settings');
  const message = document.querySelector('#message');

  const appearance = document.getElementById('appearanceSettings');
  const tabs = [...document.querySelectorAll('.popup-tabs [role="tab"]')];
  const tabStorageKey = 'easitPlusPopupTabV1';
  let tabSelectedByUser = false;
  function selectTab(selected, remember = true) {
    closeThemeMenu();
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    if (remember) {
      tabSelectedByUser = true;
      api.local.set({[tabStorageKey]: selected.id}).catch(() => {});
    }
  }
  const tabReady = api.local.get(tabStorageKey).then(data => {
    if (!tabSelectedByUser) selectTab(tabs.find(tab => tab.id === data[tabStorageKey]) || document.getElementById('ticketsTab'), false);
  }).catch(() => {});
  globalThis.EasitPlusPopupStartup?.track(tabReady);
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  }
  let queuedValue = null;
  let saving = false;
  let lastSaveError = '';
  let themeDraft=null,previewPort=null,themeEditingKey=null,themeEditorAnchor=null;
  let drainPromise = null, deletingData = false;
  function show() {
    const value = settings.get();
    const brand=document.querySelector('.brand-icon');
    brand.style.background=globalThis.EasitPlusIcon.color(value);
    brand.style.color=globalThis.EasitPlusIcon.foreground(globalThis.EasitPlusIcon.color(value));
    for (const key of ['groupingEnabled', 'firstLineWorkloadEnabled', 'mailUnreadEnabled', 'actionsUndoEnabled', 'loadingEnabled', 'snippetPickerEnabled']) document.getElementById(key).checked = value[key];
    document.getElementById('snippetPickerTrigger').value=value.snippetPickerTrigger;
    document.getElementById('snippetPickerTrigger').disabled=!value.snippetPickerEnabled;
    const colors=themeDraft||value;
    document.getElementById('themeColor').value=colors.themeColor;
    document.getElementById('secondaryThemeColor').value=colors.secondaryThemeColor;
    document.getElementById('snowfallEnabled').checked=colors.snowfallEnabled===true;
    globalThis.EasitPlusColorPicker.refresh();
    document.getElementById('loadingDismissSeconds').value=value.loadingDismissSeconds;
    document.getElementById('loadingDismissSeconds').disabled=!value.loadingEnabled;
    document.getElementById('loadingShowAfterSeconds').value=value.loadingShowAfterSeconds;
    document.getElementById('loadingShowAfterSeconds').disabled=!value.loadingEnabled;

  }
  async function drainSaves() {
    saving=true;
    let failed=false;
    while(queuedValue) {
      const value=queuedValue;queuedValue=null;
      try {await settings.save(value);failed=false;}
      catch(error) {failed=error.message||'Kunde inte spara inställningarna.';}
    }
    saving=false;settings.clearPreview();show();
    lastSaveError=failed||'';
    message.textContent=lastSaveError;
    if(failed&&!document.getElementById('appearancePanel').hidden)document.getElementById('themeMessage').textContent=failed;
  }
  function save(value) {
    if (deletingData) return;
    queuedValue=value;
    settings.preview(value);
    message.textContent='';
    if(!saving)drainPromise=drainSaves();
  }
  function readFields() {
    const value={...settings.saved()};
    for(const key of ['groupingEnabled','firstLineWorkloadEnabled','mailUnreadEnabled','actionsUndoEnabled','loadingEnabled','snippetPickerEnabled'])value[key]=document.getElementById(key).checked;
    value.snippetPickerTrigger=document.getElementById('snippetPickerTrigger').value;
    for(const key of ['loadingDismissSeconds','loadingShowAfterSeconds'])value[key]=document.getElementById(key).valueAsNumber;
    return value;
  }
  // input avfyras medan färgväljaren dras; change bekräftar slutvalet.
  for (const id of ['themeColor','secondaryThemeColor']) document.getElementById(id).addEventListener('input',previewTheme);
  fields.addEventListener('change',()=>{
    if(![...fields.querySelectorAll('input:not([data-history-filter])')].every(input=>input.reportValidity()))return;
    save(readFields());
  });

  document.querySelector('#reset').addEventListener('click', async () => {
    const reset=document.getElementById('reset');reset.disabled=true;
    try {await drainPromise;await globalThis.EasitPlusScope?.resetGrouping();await api.local.remove(['easitPlusFirstLineExcludedV1','easitPlusFirstLineExcludedTodayV1']);save(settings.defaults());}
    catch {message.textContent='Kunde inte återställa inställningarna.';}
    finally {reset.disabled=false;}
  });
  const deleteDialog = document.getElementById('deleteDataDialog');
  const deleteButton = document.getElementById('confirmDeleteData');
  const cancelDelete = document.getElementById('cancelDeleteData');
  document.getElementById('deleteAllData').addEventListener('click', () => {
    document.getElementById('deleteDataError').textContent = '';
    deleteDialog.showModal(); cancelDelete.focus();
  });
  cancelDelete.addEventListener('click', () => deleteDialog.close());
  deleteDialog.addEventListener('cancel', event => {if (deletingData) event.preventDefault();});
  deleteButton.addEventListener('click', async () => {
    if (deletingData) return;
    if(themeBusy){document.getElementById('deleteDataError').textContent='Vänta tills temat har sparats eller ändrats.';return;}
    deletingData = true; deleteButton.disabled = cancelDelete.disabled = true;
    try {
      queuedValue = null;
      await settings.ready;
      await drainPromise;
      await api.clearTiming();
      await api.local.clear();
      reloadPopup();
    } catch {
      deletingData = false; deleteButton.disabled = cancelDelete.disabled = false;
      document.getElementById('deleteDataError').textContent = 'Kunde inte radera all data. Försök igen.';
    }
  });
  async function importBackup(text) {
    try {
      if(text.length>10*1024*1024)throw new Error('Filen är för stor');
      const count=await globalThis.EasitPlusBackup.importData(JSON.parse(text));
      message.textContent=`${count} poster importerade.`;
    } catch(error) {message.textContent=`Kunde inte importera: ${error.message}`;}
  }
  document.querySelector('#export').addEventListener('click',async()=>{
    try {
      const data=await globalThis.EasitPlusBackup.exportData();
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download=`Easit-Plus-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      message.textContent='Exporterad.';
    } catch {message.textContent='Kunde inte exportera säkerhetskopian.';}
  });
  document.querySelector('#import').addEventListener('click',()=>document.querySelector('#importFile').click());
  document.querySelector('#importFile').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    if(file.size>10*1024*1024){message.textContent='Säkerhetskopian är för stor.';return;}
    try{await importBackup(await file.text());}catch{message.textContent='Kunde inte läsa filen.';}
    event.target.value='';
  });
  document.querySelector('#importPasted').addEventListener('click',()=>importBackup(document.querySelector('#importText').value));
  const themes=globalThis.EasitPlusThemes;
  const themeList=document.getElementById('themeList');
  const themeMessage=document.getElementById('themeMessage');
  const themeForm=document.getElementById('saveThemeForm');
  let themeBusy=false;
  const themeMenu=document.getElementById('themeMenu');
  let themeMenuAnchor=null;
  function closeThemeMenu(restore=false) {
    themeMenu.hidden=true;themeMenu.replaceChildren();
    if(restore&&themeMenuAnchor?.isConnected)themeMenuAnchor.focus({preventScroll:true});
    themeMenuAnchor=null;
  }
  async function changeTheme(item,index,action) {
    if(themeBusy||deletingData)return;
    closeThemeMenu();themeBusy=true;renderThemes();
    try {await action();}
    catch(error){themeMessage.textContent=error.message||'Kunde inte ändra temat.';}
    finally {
      themeBusy=false;renderThemes();
      const tiles=[...themeList.querySelectorAll('.theme-tile')];
      const target=tiles.find(tile=>tile.dataset.themeKey===item.key)||tiles[Math.min(index,tiles.length-1)];
      (target?.querySelector('.theme-preview')||document.getElementById('newTheme')).focus();
    }
  }
  function openThemeMenu(event,item,index,anchor) {
    event.preventDefault();
    if(themeBusy||deletingData)return;
    closeThemeMenu();themeMenuAnchor=anchor;
    if(item.key==='standard')return;
    const edit=document.createElement('button');edit.type='button';edit.setAttribute('role','menuitem');edit.textContent='Redigera';
    edit.addEventListener('click',()=>{closeThemeMenu();openThemeEditor(item,anchor);});
    const remove=document.createElement('button');remove.type='button';remove.setAttribute('role','menuitem');remove.textContent='Radera';
    remove.addEventListener('click',()=>changeTheme(item,index,async()=>{
      await themes.remove(item.key);themeMessage.textContent='Temat har raderats.';
    }));
    themeMenu.append(edit,remove);themeMenu.hidden=false;
    const rect=themeMenu.getBoundingClientRect(),source=anchor.getBoundingClientRect();
    const pointer=event.type==='contextmenu'&&(event.clientX||event.clientY);
    themeMenu.style.left=`${Math.max(6,Math.min(pointer?event.clientX:source.left,window.innerWidth-rect.width-6))}px`;
    themeMenu.style.top=`${Math.max(6,Math.min(pointer?event.clientY:source.bottom,window.innerHeight-rect.height-6))}px`;
    edit.focus({preventScroll:true});
  }
  themeMenu.addEventListener('keydown',event=>{
    if(event.key==='Escape'||event.key==='Tab') {
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();}
      closeThemeMenu(true);
    }else if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      event.preventDefault();const buttons=[...themeMenu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
      buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]?.focus();
    }
  });
  document.addEventListener('pointerdown',event=>{if(!themeMenu.contains(event.target))closeThemeMenu();});
  document.addEventListener('scroll',event=>{if(!themeMenu.contains(event.target)) closeThemeMenu();},true);
  window.addEventListener('resize',()=>closeThemeMenu());
  function renderThemes() {
    closeThemeMenu();
    themeList.replaceChildren();
    const items=[{key:'standard',...settings.defaults()},...themes.list()];
    for(const [index,item]of items.entries()) {
      const row=document.createElement('li');row.className='theme-tile';row.dataset.themeKey=item.key;
      const preview=document.createElement('button');preview.type='button';preview.className='theme-preview';
      preview.setAttribute('data-easit-plus-color-value','');
      const accent=globalThis.EasitPlusIcon.color(item),background=item.secondaryThemeEnabled?item.secondaryThemeColor:'#ffffff';
      preview.style.backgroundColor=background;
      preview.setAttribute('aria-label',item.key==='standard'?'Använd standardtema':`Använd tema ${index}`);
      preview.title=item.key==='standard'?'Standardtema · Easits originalutseende':`Huvudfärg ${accent}, bakgrund ${background}`;
      const logo=document.createElement('canvas');logo.width=logo.height=96;logo.setAttribute('aria-hidden','true');
      globalThis.EasitPlusIcon.draw(logo.getContext('2d'),96,accent);preview.append(logo);
      if(item.key!=='standard')preview.setAttribute('aria-haspopup','menu');
      preview.disabled=themeBusy;
      preview.addEventListener('click',()=>changeTheme(item,index,async()=>{
        await drainPromise;
        save({...settings.saved(),...themes.values(item)});
        await drainPromise;
        if(message.textContent)throw new Error(message.textContent);
        themeMessage.textContent='Temat används.';
      }));
      preview.addEventListener('contextmenu',event=>openThemeMenu(event,item,index,preview));
      preview.addEventListener('keydown',event=>{
        if(event.key==='ContextMenu'||event.key==='F10'&&event.shiftKey)openThemeMenu(event,item,index,preview);
      });
      row.append(preview);themeList.append(row);
    }
  }
  const themeDialog=document.getElementById('themeDialog');
  const editorMessage=document.getElementById('themeEditorMessage');
  function previewTheme() {
    if(!themeDraft)return;
    themeDraft={themeEnabled:true,secondaryThemeEnabled:true,themeColor:document.getElementById('themeColor').value,secondaryThemeColor:document.getElementById('secondaryThemeColor').value,secondaryThemeTextMode:'auto',snowfallEnabled:document.getElementById('snowfallEnabled').checked};
    settings.preview({...settings.saved(),...themeDraft});
    globalThis.EasitPlusTheme?.flush();
    try {previewPort?.postMessage({values:themeDraft});}
    catch {editorMessage.textContent='Förhandsvisningen i Easit avbröts. Dina färgval finns kvar.';}
  }
  async function openThemeEditor(item=null,anchor=document.getElementById('newTheme')) {
    await drainPromise;
    themeEditingKey=item?.key||null;themeEditorAnchor=anchor;
    document.getElementById('themeDialogTitle').textContent=item?'Redigera tema':'Nytt tema';
    const value=item||settings.saved();
    themeDraft={themeEnabled:true,secondaryThemeEnabled:true,themeColor:globalThis.EasitPlusIcon.color(value),secondaryThemeColor:value.secondaryThemeEnabled?value.secondaryThemeColor:'#ffffff',secondaryThemeTextMode:'auto',snowfallEnabled:value.snowfallEnabled===true};
    editorMessage.textContent='';

    previewPort=api.preview();
    const port=previewPort;
    port.onMessage.addListener(message=>{if(message.error)editorMessage.textContent=message.error;});
    port.onDisconnect.addListener(()=>{
      if(previewPort!==port)return;
      previewPort=null;
      editorMessage.textContent='Förhandsvisningen i Easit avbröts. Dina färgval finns kvar.';
    });
    show();themeDialog.showModal();document.getElementById('themeColor').focus();previewTheme();
  }
  document.getElementById('snowfallEnabled').addEventListener('change',previewTheme);
  document.getElementById('newTheme').addEventListener('click',()=>openThemeEditor());
  function stopThemePreview() {
    const port=previewPort;previewPort=null;themeDraft=null;
    port?.disconnect();settings.clearPreview();globalThis.EasitPlusTheme?.flush();
  }
  function finishThemeEditor() {
    stopThemePreview();themeEditingKey=null;
    (themeEditorAnchor?.isConnected?themeEditorAnchor:document.getElementById('newTheme')).focus();
  }
  function closeThemeEditor() {themeDialog.close();finishThemeEditor();}
  themeDialog.addEventListener('close',()=>{if(!themeDialog.open&&themeDraft)finishThemeEditor();});
  themeDialog.addEventListener('cancel',event=>{event.preventDefault();if(!themeBusy)closeThemeEditor();});
  document.getElementById('cancelTheme').addEventListener('click',()=>{if(!themeBusy)closeThemeEditor();});
  window.addEventListener('pagehide',stopThemePreview);
  window.addEventListener('message',event=>{
    if(window===window.top||event.source!==window.parent||event.origin!=='https://sjalvservice-it.norrkoping.se'||event.data?.type!=='easit-plus-popup-hidden')return;
    document.getElementById('releaseNotes').close();
    const picker=document.getElementById('colorDialog');
    if(picker.open)picker.close();
    if(themeDialog.open)closeThemeEditor();
    stopThemePreview();closeThemeMenu();
  });
  themeForm.addEventListener('submit',async event=>{
    event.preventDefault();if(themeBusy||deletingData||!themeDraft)return;
    themeBusy=true;appearance.disabled=true;document.getElementById('saveTheme').disabled=document.getElementById('cancelTheme').disabled=true;
    try {
      await themes.save({...settings.saved(),...themeDraft},{activate:true,key:themeEditingKey});
      closeThemeEditor();themeMessage.textContent='Temat har sparats.';
    }catch(error){editorMessage.textContent=error.message||'Kunde inte spara temat. Försök igen.';}
    finally {themeBusy=false;appearance.disabled=false;document.getElementById('saveTheme').disabled=document.getElementById('cancelTheme').disabled=false;renderThemes();}
  });
  themes.subscribe(renderThemes);
  const themesReady=Promise.all([themes.ready,settings.ready]).then(()=>{renderThemes();document.getElementById('newTheme').disabled=false;})
    .catch(()=>{themeMessage.textContent='Kunde inte läsa sparade teman. Öppna Easit+ igen.';});
  globalThis.EasitPlusPopupStartup?.track(themesReady);
  settings.subscribe(() => {if (!saving) show();});
  const fieldsReady = settings.ready.then(() => {show(); fields.disabled = appearance.disabled = false;}).catch(() => {
    message.textContent = 'Kunde inte läsa inställningarna. Öppna Easit+ igen.';
  });
  globalThis.EasitPlusPopupStartup?.track(fieldsReady);
}

function initHistoryPopup({document, globalThis, api}) {
  const history=globalThis.EasitPlusLoadHistory,copy=document.getElementById('copyLoadHistory'),clear=document.getElementById('clearLoadHistory'),message=document.getElementById('loadHistoryMessage');
  const filter=document.getElementById('loadHistoryFilter'),resetFilter=document.getElementById('clearLoadHistoryFilter');
  let entries=[],generation=0,minimum=null;
  function render() {
    const visible=history.select(entries,minimum);
    const s=history.stats(visible);document.getElementById('loadHistoryCount').textContent=`${entries.length}/${history.LIMIT}`;
    document.getElementById('loadHistoryFilterCount').textContent=`(${visible.length}/${entries.length})`;
    resetFilter.disabled=minimum===null;
    document.getElementById('loadMedian').textContent=history.seconds(s.median);document.getElementById('loadLongest').textContent=history.seconds(s.longest);
    copy.disabled=!visible.length;clear.disabled=!entries.length;copy.textContent='Kopiera allt';
    const list=document.getElementById('loadHistoryRows');list.replaceChildren();
    for(const item of [...visible].reverse()) {
      const row=document.createElement('tr');
      for(const text of [history.date(item.startedAt),history.seconds(item.durationMs),item.source==='icon'?'Laddsymbol':'Nätanrop']) {const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
      list.append(row);
    }
    const empty=document.getElementById('loadHistoryEmpty');empty.hidden=!!visible.length;
    empty.textContent=entries.length?'Inga mätningar matchar filtret.':'Inga mätningar.';
  }
  async function read() {
    const stamp=++generation;
    try {const data=await api.local.get(history.KEY);if(stamp!==generation)return;entries=history.normalize(data[history.KEY]);render();}
    catch {message.textContent='Kunde inte läsa laddningshistoriken.';}
  }
  api.changes.addListener((changes,area)=>{if(area==='local'&&changes[history.KEY]){generation++;entries=history.normalize(changes[history.KEY].newValue);render();}});
  copy.addEventListener('click',async()=>{try{await globalThis.EasitPlusFeedback.copyText(history.format(history.select(entries,minimum)));copy.textContent='Kopierat';message.textContent='';}catch{message.textContent='Kunde inte kopiera historiken.';}});
  clear.addEventListener('click',async()=>{
    clear.disabled=true;
    try {const result=await api.send({type:'easit-plus-history-clear-v1'});if(!result?.ok)throw Error();await read();message.textContent='Rensad.';}
    catch {message.textContent='Kunde inte rensa historiken. Öppna Easit+ igen.';render();}
  });
  for(const type of ['input','change'])filter.addEventListener(type,event=>{
    event.stopPropagation();
    if(!filter.checkValidity())return;
    minimum=filter.value===''||filter.valueAsNumber===0?null:filter.valueAsNumber;render();
  });
  resetFilter.addEventListener('click',event=>{event.stopPropagation();filter.value='0';minimum=null;render();filter.focus();});
  const initialReady = read();
  globalThis.EasitPlusPopupStartup?.track(initialReady);
}

function initTicketsPopup({window, document, globalThis, api}) {
  const PIN='easitPlusPinV1:', NOTE='easitPlusNoteV1:';
  const tickets=globalThis.EasitPlusTickets;
  const list=document.getElementById('ticketList'), menu=document.getElementById('ticketMenu');
  const search=document.getElementById('ticketSearch'), searchIndex=new Map();
  const message=document.getElementById('ticketsMessage'), dialog=document.getElementById('ticketNoteDialog');
  const noteText=document.getElementById('ticketNoteText'), noteIcon=document.getElementById('ticketNoteIcon');
  const notes=globalThis.EasitPlusNotes,followPicker=globalThis.EasitPlusFollowupPicker.create();
  document.getElementById('ticketNoteFollowUp').append(followPicker.element);
  const save=document.getElementById('ticketNoteSave'), error=document.getElementById('ticketNoteError');
  let records=new Map(), revision=0, editing=null, menuAnchor=null;
  const keyFor=(prefix,id)=>prefix+encodeURIComponent(id);
  const note=globalThis.EasitPlusNotes.normalize;
  function closeMenu(restore=false) {
    menu.hidden=true;menu.replaceChildren();
    if(restore && menuAnchor?.isConnected)menuAnchor.focus({preventScroll:true});
    menuAnchor=null;
  }
  async function open(id) {
    const url=tickets.url(id);
    if(!url)throw new Error('Ärendenumret kan inte användas för att öppna en ärendelänk.');
    await api.openTicket(url);
  }
  async function perform(action) {
    try {await action();message.textContent='';}
    catch (err) {message.textContent=err.message || 'Kunde inte utföra åtgärden. Försök igen.';}
  }
  function edit(id) {
    const record=records.get(id);if(!record?.note)return;
    editing=id;noteText.value=record.note.text;noteIcon.value=record.note.emoji;
    followPicker.setValue(record.note.followUpAt);
    document.getElementById('ticketNoteTitle').textContent=`Anteckning · ${id}`;
    error.textContent='';save.disabled=false;dialog.showModal();noteText.focus();
  }
  function showMenu(id,anchor,x,y) {
    closeMenu();const record=records.get(id);if(!record)return;
    menuAnchor=anchor;
    const actions=[
      ['Öppna i ny flik',()=>open(id),!tickets.url(id)],
      ['Kopiera ärendelänk',async()=>{const url=tickets.url(id);if(globalThis.EasitPlusFeedback)await globalThis.EasitPlusFeedback.copyText(url);else await GM_setClipboard(url);},!tickets.url(id)],
      ['Redigera anteckning',()=>edit(id),!record.note],
      ['Avfärda uppföljning',()=>notes.dismiss(id,record.note.followUpAt),!notes.isDue(record.note)],
      ['Ta bort anteckning',()=>notes.remove(id),!record.note],
      ['Ta bort fästning',()=>api.local.remove(keyFor(PIN,id)),!record.pinned]
    ];
    for(const [label,action,unavailable] of actions) {
      if(unavailable)continue;
      const button=document.createElement('button');button.type='button';button.role='menuitem';
      button.textContent=label;
      button.addEventListener('click',()=>{closeMenu(true);perform(action);});menu.append(button);
    }
    menu.hidden=false;
    const rect=menu.getBoundingClientRect();
    menu.style.left=`${Math.max(6,Math.min(x,window.innerWidth-rect.width-6))}px`;
    menu.style.top=`${Math.max(6,Math.min(y,window.innerHeight-rect.height-6))}px`;
    menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function filter() {
    const terms=search.value.trim().toLocaleLowerCase('sv').split(/\s+/).filter(Boolean);
    let count=0;
    for(const row of list.children) {
      const text=searchIndex.get(row.dataset.ticketId) || '';
      row.hidden=!terms.every(term=>text.includes(term));
      if(!row.hidden)count++;
    }
    document.getElementById('ticketCount').textContent=terms.length?`(${count}/${records.size})`:`(${records.size})`;
    const empty=document.getElementById('ticketsEmpty');
    empty.textContent=records.size?'Inga ärenden matchar sökningen.':'Inga sparade ärenden.';
    empty.hidden=count>0;
  }
  search.addEventListener('input',()=>{closeMenu();filter();});
  search.addEventListener('keydown',event=>{
    if(event.key!=='Escape' || !search.value)return;
    event.preventDefault();event.stopPropagation();search.value='';closeMenu();filter();
  });
  async function refresh() {
    const request=++revision;
    try {
      const data=await api.local.get(null);if(request!==revision)return;
      const expanded=new Set([...list.children].filter(row=>row.querySelector('details')?.open).map(row=>row.dataset.ticketId));
      const ids=new Set();
      for(const key of Object.keys(data)) {
        if(!key.startsWith(PIN) && !key.startsWith(NOTE))continue;
        try {const id=decodeURIComponent(key.slice(key.indexOf(':')+1));if(id && id.length<=1000)ids.add(id);}catch{}
      }
      records=new Map();searchIndex.clear();
      for(const id of ids) {
        const pinned=data[keyFor(PIN,id)]===true, annotation=note(data[keyFor(NOTE,id)]);
        if(!pinned && !annotation)continue;
        const metadata=tickets.normalize(data[tickets.keyFor(id)]);
        records.set(id,{id,pinned,note:annotation,metadata:metadata?.id===id?metadata:null});
      }
      const fragment=document.createDocumentFragment();
      for(const record of [...records.values()].sort((a,b)=>Number(b.pinned)-Number(a.pinned) || a.id.localeCompare(b.id,'sv',{numeric:true}))) {
        const {id,pinned,note:annotation,metadata}=record;
        searchIndex.set(id,[id,'#'+id,metadata?.title,metadata?.status,metadata?.handler,annotation?.text,annotation?.emoji].filter(value=>value!=null).join(' ').toLocaleLowerCase('sv'));
        const row=document.createElement('li');row.className='ticket-row';row.dataset.ticketId=id;
        const heading=document.createElement('div');heading.className='ticket-heading';
        const link=document.createElement('a');link.className='ticket-open';
        const url=tickets.url(id);if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}
        else {link.role='link';link.tabIndex=0;link.setAttribute('aria-disabled','true');}
        const number=document.createElement('strong');number.textContent=`#${id}`;
        const icons=document.createElement('span');icons.className='ticket-icons';
        if(pinned){const pin=document.createElement('span');pin.textContent='📌';pin.title='Fäst ärende';pin.setAttribute('aria-label','Fäst ärende');icons.append(pin);}
        if(annotation){const icon=document.createElement('span');icon.textContent=annotation.emoji;icon.title='Har anteckning';icon.setAttribute('aria-label',`Anteckning ${annotation.emoji}`);icons.append(icon);}
        const title=document.createElement('span');title.className='ticket-title';title.textContent=metadata?.title || 'Rubrik saknas';
        const status=document.createElement('span');status.className='ticket-status';status.textContent=`Status: ${metadata?.status || 'Inte avläst'}`;
        const handler=document.createElement('span');handler.className='ticket-status ticket-handler';
        handler.textContent=`Handläggare: ${metadata?.handler == null ? 'Inte avläst' : metadata.handler || 'Utan handläggare'}`;
        const updated=document.createElement('span');updated.className='ticket-status ticket-updated';
        updated.textContent=`Senast uppdaterad: ${metadata?.updated || 'Inte avläst'}`;
        const observed=document.createElement('span');observed.className='ticket-status ticket-observed';
        observed.textContent=`Senast avläst: ${metadata ? new Date(metadata.observedAt).toLocaleString('sv-SE') : 'Inte avläst'}`;
        const meta=document.createElement('div');meta.className='ticket-meta';meta.append(number,icons,status);
        link.append(meta,title,handler);
        link.addEventListener('click',event=>{event.preventDefault();perform(()=>open(id));});
        const more=document.createElement('button');more.type='button';more.className='ticket-more';more.textContent='⋯';
        more.setAttribute('aria-label',`Åtgärder för ärende ${id}`);more.setAttribute('aria-haspopup','menu');
        more.addEventListener('click',()=>{const rect=more.getBoundingClientRect();showMenu(id,more,rect.right,rect.bottom);});
        heading.append(link,more);row.append(heading);
        if(annotation?.text.trim()) {
          const body=document.createElement('p');body.className='ticket-note';body.textContent=annotation.text;row.append(body);
        }
        if(annotation?.followUpAt) {
          const follow=document.createElement('div');follow.className='ticket-follow-up';
          follow.classList.toggle('is-due',notes.isDue(annotation));
          const when=document.createElement('time');when.dateTime=new Date(annotation.followUpAt).toISOString();
          when.textContent='Uppföljning · '+new Date(annotation.followUpAt).toLocaleString('sv-SE',{dateStyle:'short',timeStyle:'short'})+(annotation.followUpDismissedAt?' · Avfärdad':'');
          follow.append(when);
          if(notes.isDue(annotation)) {
            const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Avfärda';dismiss.setAttribute('aria-label','Avfärda uppföljning');
            dismiss.addEventListener('click',()=>perform(async()=>{
              dismiss.disabled=true;
              try {await notes.dismiss(id,annotation.followUpAt);await refresh();}
              finally {dismiss.disabled=false;}
            }));follow.append(dismiss);
          }
          row.append(follow);
        }
        const details=document.createElement('details');details.className='ticket-details';details.open=expanded.has(id);
        const summary=document.createElement('summary');summary.textContent='Detaljer';
        const dates=document.createElement('div');dates.className='ticket-dates';dates.append(updated,observed);details.append(summary,dates);row.append(details);
        row.addEventListener('contextmenu',event=>{event.preventDefault();const rect=link.getBoundingClientRect();showMenu(id,more,event.clientX || rect.left,event.clientY || rect.bottom);});
        fragment.append(row);
      }
      closeMenu();list.replaceChildren(fragment);
      filter();
    } catch {if(request===revision)message.textContent='Kunde inte läsa ärendena. Öppna Easit+ igen.';}
  }
  document.getElementById('ticketNoteCancel').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('cancel',event=>{if(followPicker.isOpen())event.preventDefault();});
  dialog.addEventListener('close',()=>{editing=null;followPicker.close();});
  document.getElementById('ticketNoteForm').addEventListener('submit',async event=>{
    event.preventDefault();if(!editing || save.disabled)return;
    save.disabled=true;
    try {
      const at=followPicker.value();
      await notes.save(editing,{text:noteText.value,emoji:noteIcon.value,...(at===null?{}:{followUpAt:at})});
      dialog.close();
    } catch (err) {error.textContent=err.message||'Kunde inte spara anteckningen. Försök igen.';save.disabled=false;}
  });
  menu.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp','Home','End','Escape','Tab'].includes(event.key))return;
    if(event.key==='Tab'){closeMenu();return;}
    event.preventDefault();
    if(event.key==='Escape'){closeMenu(true);return;}
    const buttons=[...menu.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
    buttons[next]?.focus();
  });
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))closeMenu();});
  document.addEventListener('scroll',event=>{if(!menu.contains(event.target)) closeMenu();},true);
  document.querySelectorAll('.popup-tabs button').forEach(button=>button.addEventListener('click',()=>closeMenu()));
  api.changes.addListener((changes,area)=>{
    if(area==='local' && Object.keys(changes).some(key=>[PIN,NOTE,tickets.PREFIX].some(prefix=>key.startsWith(prefix))))refresh().then(scheduleDeadline);
  });
  const initialReady = refresh();
  // The popup can remain open across a deadline, including inside Easit's header.
  let dueTimer=null;
  async function scheduleDeadline() {
    clearTimeout(dueTimer);
    const times=[...records.values()].map(record=>record.note).filter(note=>note?.followUpAt>Date.now()&&!note.followUpDismissedAt).map(note=>note.followUpAt);
    if(times.length)dueTimer=setTimeout(async()=>{await refresh();scheduleDeadline();},Math.max(1,Math.min(2147483647,Math.min(...times)-Date.now())));
  }
  initialReady.then(scheduleDeadline);
  window.addEventListener('focus',()=>refresh().then(scheduleDeadline));
  globalThis.EasitPlusPopupStartup?.track(initialReady);
}

function initExclusions({api}) {
  const MESSAGE='easit-plus-exclusion-edit-v1';
  const PERMANENT='easitPlusFirstLineExcludedV1',DAILY='easitPlusFirstLineExcludedTodayV1';
  const tidy=value=>typeof value==='string'?value.normalize('NFC').replace(/\s+/g,' ').trim():'';
  const key=value=>tidy(value).toLocaleLowerCase('sv');
  let queue=Promise.resolve();
  async function edit(message) {
    const name=tidy(message.name);
    if(!name||name.length>200||!['add','remove','today'].includes(message.action))throw new Error('Ogiltigt namn eller val.');
    const data=await api.local.get([PERMANENT,DAILY]);
    const names=Array.isArray(data[PERMANENT])?data[PERMANENT]:[];
    const daily=(Array.isArray(data[DAILY])?data[DAILY]:[]).filter(item=>item&&item.until>Date.now());
    let nextNames=names,nextDaily=daily.filter(item=>key(item.name)!==key(name));
    if(message.action==='remove')nextNames=names.filter(value=>key(value)!==key(name));
    if(message.action==='add')nextNames=[...new Map([...names,name].map(value=>[key(value),value])).values()];
    if(message.action==='today') {
      if(names.some(value=>key(value)===key(name)))return;
      const midnight=new Date();midnight.setHours(24,0,0,0);
      nextDaily.push({name,until:midnight.getTime()});
    }
    if(nextNames.length>500||nextDaily.length>500)throw new Error('För många exkluderade namn.');
    const changes={};
    if(JSON.stringify(nextNames)!==JSON.stringify(names))changes[PERMANENT]=nextNames;
    if(JSON.stringify(nextDaily)!==JSON.stringify(data[DAILY]||[]))changes[DAILY]=nextDaily;
    if(Object.keys(changes).length)await api.local.set(changes);
  }
  api.messages.addListener((message,respond)=>{
    if(message?.type!==MESSAGE)return;
    const task=queue.then(()=>edit(message));
    queue=task.catch(()=>{});
    task.then(()=>respond({ok:true}),()=>respond({ok:false}));
    return true;
  });
}

function initNoteEdits({globalThis, api}) {
  const notes=globalThis.EasitPlusNotes;
  let queue=Promise.resolve();
  async function edit(message) {
    const {id,action}=message;
    if(typeof id!=='string'||!id.trim()||id.length>1000||!['save','remove','dismiss'].includes(action))throw new Error('Ogiltig anteckning.');
    const key=notes.PREFIX+encodeURIComponent(id);
    if(action==='remove'){await api.local.remove(key);return;}
    const data=await api.local.get(key),previous=notes.normalize(data[key]);
    if(action==='dismiss') {
      if(!previous||previous.followUpAt!==message.expectedAt||!notes.isDue(previous))return;
      await api.local.set({[key]:{...previous,followUpDismissedAt:Date.now()}});return;
    }
    const value=notes.normalize(message.note,{strict:true});
    if(!value||!notes.ICONS.includes(message.note.emoji))throw new Error('Ogiltig anteckning.');
    // A stale editor cannot undo a dismissal made in another tab. Changing
    // the date creates a new reminder; editing text at the same date does not.
    delete value.followUpDismissedAt;
    if(value.followUpAt&&value.followUpAt===previous?.followUpAt&&previous.followUpDismissedAt)value.followUpDismissedAt=previous.followUpDismissedAt;
    await api.local.set({[key]:value});
  }
  api.messages.addListener((message,respond)=>{
    if(message?.type!=='easit-plus-note-edit-v1')return;
    const task=queue.then(()=>edit(message));queue=task.catch(()=>{});
    task.then(()=>respond({ok:true}),()=>respond({ok:false,error:'Kunde inte spara anteckningen. Försök igen.'}));
    return true;
  });

}

/* Pure transitions for a timing cycle. The caller supplies timestamps. */
function initLoadCycle({globalThis}) {
  function create() {
    const pending=new Map(),cycles=new Map(),icons=new Map();
    const requestsFor=tabId=>[...pending.values()].filter(item=>item.tabId===tabId);
    const waiting=tabId=>requestsFor(tabId).length>0||cycles.get(tabId)?.source==='icon'&&!!icons.get(tabId)?.busy;
    function begin(item,click,selection=false) {
      const added=!pending.has(item.id);if(added)pending.set(item.id,item);
      let cycle=cycles.get(item.tabId),cancelled=false;
      if(selection&&(!cycle||cycle.source==='icon')) {
        const icon=icons.get(item.tabId);if(icon)icon.suppressed=true;
        if(cycle){cycles.delete(item.tabId);cycle=null;cancelled=true;}
      }
      if(click&&!cycle) {
        cycle={id:item.id,tabId:item.tabId,startedAt:item.startedAt,lastAt:item.startedAt,settleUntil:null,source:'network'};
        cycles.set(item.tabId,cycle);
      }
      if(click&&cycle)cycle.source='network';
      if(cycle){cycle.settleUntil=null;cycle.lastAt=Math.max(cycle.lastAt,item.startedAt);}
      return {changed:added||!!cycle||cancelled,active:!!cycle,cancelled};
    }
    function finish(id,at) {
      const item=pending.get(id);if(!item)return null;
      pending.delete(id);
      const cycle=cycles.get(item.tabId);if(cycle)cycle.lastAt=Math.max(cycle.lastAt,at);
      return item.tabId;
    }
    function icon(tabId,busy,at) {
      if(!!icons.get(tabId)?.busy===busy)return false;
      let cycle=cycles.get(tabId);
      if(busy) {
        const suppressed=requestsFor(tabId).some(item=>item.selection);
        icons.set(tabId,{tabId,busy:true,suppressed});
        if(!cycle&&!suppressed){cycle={id:'icon-'+tabId+'-'+at,tabId,startedAt:at,lastAt:at,settleUntil:null,source:'icon'};cycles.set(tabId,cycle);}
        if(cycle?.source==='icon')cycle.settleUntil=null;
      } else {
        icons.delete(tabId);
        if(cycle?.source==='icon')cycle.lastAt=Math.max(cycle.lastAt,at);
      }
      return true;
    }
    function clear(tabId,frameId=null,at=0) {
      let changed=false;
      for(const [id,item]of pending)if(item.tabId===tabId&&(frameId===null||item.frameId===frameId)){pending.delete(id);changed=true;}
      if(frameId===null){changed=cycles.delete(tabId)||changed;changed=icons.delete(tabId)||changed;}
      else if(changed&&cycles.has(tabId))cycles.get(tabId).lastAt=Math.max(cycles.get(tabId).lastAt,at);
      return changed;
    }
    function settle(tabId,now) {
      const cycle=cycles.get(tabId);if(!cycle)return null;
      if(waiting(tabId)){cycle.settleUntil=null;return null;}
      if(!Number.isFinite(cycle.settleUntil))cycle.settleUntil=now+500;
      return cycle.settleUntil;
    }
    return {pending,cycles,icons,requestsFor,waiting,begin,finish,icon,clear,settle};
  }
  globalThis.EasitPlusLoadCycle=Object.freeze({create});
}

// Storage, network timing and startup

// Each fixed GM key has a change listener before modules start, including for
// records created by other tabs. Group writes to settings and themes atomically.
const partitions = ['preferences', 'tickets', 'notes', 'pins', 'snippets', 'history', 'lists'];
function partition(key) {
  for (const [prefix, group] of [
    ['easitPlusTicketV1:', 'tickets'], ['easitPlusNote', 'notes'],
    ['easitPlusPin', 'pins'], ['easitPlusSnippetV1:', 'snippets'],
    ['easitPlusLoadHistory', 'history'], ['easitPlusGrouping', 'lists'], ['easitPlusCollapsed', 'lists']
  ]) if (key.startsWith(prefix)) return group;
  return 'preferences';
}
function eventList() {
  const callbacks = new Set();
  return {
    addListener(fn) { callbacks.add(fn); },
    removeListener(fn) { callbacks.delete(fn); },
    emit(...args) { for (const fn of callbacks) fn(...args); }
  };
}
const storageChanges = eventList();
for (const group of partitions) {
  GM_addValueChangeListener(group, (_key, before = {}, after = {}) => {
    const changes = Object.create(null);
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = {oldValue: before[key], newValue: after[key]};
      }
    }
    if (Object.keys(changes).length) storageChanges.emit(changes, 'local');
  });
}
// GM's asynchronous write acknowledgement precedes propagation to other
// tabs' GM_getValue caches. A Web Lock alone could serialize two stale reads.
// Keep just the expected revision on the origin. Payloads stay in GM storage.
const prefix = 'Easit+ ' + GM_info.uuid + ' ';
const revisionKey = 'userscriptStorageRevision';
const watermark = prefix + revisionKey;
const joined = navigator.locks.request(prefix + 'join', async () => {
  const first = await navigator.locks.request(prefix + 'active', {ifAvailable:true}, lock => !!lock);
  if (first) localStorage.removeItem(watermark);
  await new Promise((resolve, reject) => {
    navigator.locks.request(prefix + 'active', {mode:'shared'}, () => {
      resolve();
      return new Promise(release => window.addEventListener('pagehide', release, {once:true}));
    }).catch(reject);
  });
});
async function fresh() {
  const target = Number(localStorage.getItem(watermark)) || 0;
  if (GM_getValue(revisionKey, 0) >= target) return;
  await new Promise((resolve, reject) => {
    const listener = GM_addValueChangeListener(revisionKey, check);
    const timeout = setTimeout(() => {
      GM_removeValueChangeListener(listener);
      reject(Error('Lagringen har inte hunnit synkroniseras. Försök igen.'));
    }, 10000);
    function check() {
      if (GM_getValue(revisionKey, 0) < target) return;
      clearTimeout(timeout); GM_removeValueChangeListener(listener); resolve();
    }
    check();
  });
}
async function locked(name, work) {
  await joined;
  return navigator.locks.request(prefix + name, async () => { await fresh(); return work(); });
}
// Caller owns the storage lock. Put the revision last in the same GM update.
async function commitGroups(values) {
  const revision = GM_getValue(revisionKey, 0) + 1;
  await GM.setValues({...values, [revisionKey]:revision});
  localStorage.setItem(watermark, String(revision));
}
async function updateGroups(edit) {
  return locked('storage', async () => {
    const updates = {};
    function groupFor(key) {
      const name = partition(key);
      return updates[name] ??= GM_getValue(name, {});
    }
    edit(groupFor);
    if (Object.keys(updates).length) await commitGroups(updates);
  });
}
const local = {
  async get(keys) {
    if (keys == null) return Object.assign({}, ...partitions.map(name => GM_getValue(name, {})));
    const result = {}, groups = {};
    for (const key of [].concat(keys)) {
      const name = partition(key), values = groups[name] ??= GM_getValue(name, {});
      if (Object.hasOwn(values, key)) result[key] = values[key];
    }
    return result;
  },
  set(values) {
    return updateGroups(groupFor => {
      for (const [key, value] of Object.entries(values)) groupFor(key)[key] = value;
    });
  },
  remove(keys) {
    return updateGroups(groupFor => { for (const key of [].concat(keys)) delete groupFor(key)[key]; });
  },
  clear() { return locked('storage', () => commitGroups(Object.fromEntries(partitions.map(group => [group, {}])))); }
};

// All privileged handlers are private to the userscript closure.
const site = 'https://sjalvservice-it.norrkoping.se';
const messageHandlers = eventList();
const loadMessages = eventList();
const previewKey = 'easitPlusThemePreviewV1';
const previewOwner = 'userscriptPreviewOwner';
const lifetimeName = token => 'Easit+ preview session ' + token;
function clearPreview(token) {
  return locked('preview', async () => {
    if ((await local.get(previewOwner))[previewOwner] === token) {
      await local.remove([previewOwner, previewKey]);
    }
  });
}
// A browser lock is released even when a tab is discarded without pagehide.
async function watchPreview(token) {
  if (typeof token === 'string') await navigator.locks.request(lifetimeName(token), () => clearPreview(token));
}
if (unsafeWindow === unsafeWindow.top) {
  storageChanges.addListener(changes => {
    if (changes[previewOwner]?.newValue) void watchPreview(changes[previewOwner].newValue);
  });
  void local.get(previewOwner).then(data => watchPreview(data[previewOwner]));
}
function previewPort() {
  const token = crypto.randomUUID(), onDisconnect = eventList(), onMessage = eventList();
  let release, closed = false;
  const lifetime = new Promise(resolve => { release = resolve; });
  let ready;
  const acquired = new Promise(resolve => { ready = resolve; });
  void navigator.locks.request(lifetimeName(token), async () => { ready(); await lifetime; });
  const claimed = acquired.then(() => locked('preview', () => local.set({[previewOwner]:token})));
  return {
    onMessage, onDisconnect,
    postMessage({values}) {
      if (closed || !values) return;
      void claimed.then(() => locked('preview', async () => {
        if (!closed && (await local.get(previewOwner))[previewOwner] === token) {
          await local.set({[previewKey]:values});
        }
      })).catch(() => onMessage.emit({error:'Kunde inte förhandsvisa temat.'}));
    },
    disconnect() {
      if (closed) return;
      closed = true;
      void claimed.finally(release);
      onDisconnect.emit();
    }
  };
}
function platform(isPopup, cleanup) {
  const onChanged = {addListener(fn) {
    storageChanges.addListener(fn);
    cleanup.push(() => storageChanges.removeListener(fn));
  }};
  async function send(message) {
    if (message.type === 'easit-plus-note-edit-v1' || message.type === 'easit-plus-exclusion-edit-v1') {
      return locked('edit ' + message.type, () => new Promise(resolve => {
        messageHandlers.emit(message, resolve);
      }));
    }
    if (isPopup && message.type === 'easit-plus-history-clear-v1') {
      await locked('history', () => local.remove('easitPlusLoadHistoryV1'));
      return {ok:true};
    }
    return network?.command(message);
  }
  function preview() {
    const port = previewPort();
    const disconnect = () => port.disconnect();
    cleanup.push(disconnect);
    port.onDisconnect.addListener(() => {
      const index = cleanup.indexOf(disconnect);
      if (index >= 0) cleanup.splice(index, 1);
    });
    return port;
  }
  return {
    local, changes:onChanged, messages:loadMessages, send, preview,
    clearTiming:() => network?.clear(),
    openTicket(url) {
      if (new URL(url).origin !== site) throw Error('Ogiltig ärendelänk.');
      GM_openInTab(url, {active:true});
    }
  };
}

// The page's requests remain owned by Easit. Only classification and timing
// cross frame boundaries. Never send a URL, payload, cookie or response body.
const timingChannel = 'easit-plus-userscript-timing-v1';
function observeRequests(page) {
  const frame = crypto.randomUUID();
  const transmit = (phase, extra = {}) => {
    const event = {channel:timingChannel, frame, phase, at:Date.now(), ...extra};
    if (page === page.top) network?.receive(event);
    else page.top.postMessage(event, site);
  };
  function isZkPost(address, method) {
    return address.origin === site && /(?:^|\/)zkau(?:[/;]|$)/.test(address.pathname) && method?.toUpperCase() === 'POST';
  }
  function start(url, method, body) {
    let address;
    try { address = new URL(url, page.document.baseURI); } catch { return; }
    if (address.origin !== site) return;
    const id = crypto.randomUUID(), at = Date.now();
    function begin(fields) {
      // Multipart ZK uploads put the encoded AU fields in "data" next to
      // attachments. Only inspect the string form field, never the files.
      const encoded = fields instanceof page.FormData && fields.get('data');
      if (typeof encoded === 'string') fields = new URLSearchParams(encoded);
      const commands = [];
      let namespace = '';
      for (const [key] of fields) if (key.endsWith('dtid')) { namespace = key.slice(0, -4); break; }
      for (const [key, value] of fields) {
        if (key.startsWith(namespace) && /^cmd_\d+$/.test(key.slice(namespace.length))) commands.push(value);
      }
      if (commands.length && commands.every(value => value === 'dummy')) return false;
      const selection = commands.includes('onSelect');
      transmit('begin', {id, at, click:!selection && commands.includes('onClick'), selection});
      return true;
    }
    let fields = [];
    if (isZkPost(address, method)) {
      if (typeof body === 'string') fields = new URLSearchParams(body);
      else if (body instanceof page.URLSearchParams || body instanceof page.FormData) fields = body;
      else if (ArrayBuffer.isView(body) || body instanceof page.ArrayBuffer) {
        fields = new URLSearchParams(new TextDecoder().decode(body));
      } else if (body instanceof page.Blob || body instanceof page.Request) {
        const reading = body instanceof page.Request && /^multipart\/form-data/i.test(body.headers.get('Content-Type') || '')
          ? body.formData() : body.text().then(text => new URLSearchParams(text));
        const begun = reading.then(begin, () => begin([]));
        return () => {
          const ended = Date.now();
          void begun.then(active => { if (active) transmit('finish', {id, at:ended}); });
        };
      }
    }
    if (begin(fields)) return () => transmit('finish', {id});
  }
  // Fetch resolves at headers. Resource Timing observes the end of the actual
  // transfer without reading, cloning or delaying the application's response.
  const transfers = new Map();
  const resources = new page.PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      const queue = transfers.get(entry.name);
      if (entry.initiatorType !== 'fetch' || !queue?.length) continue;
      // Concurrent requests to the same URL can complete out of start order.
      let nearest = queue[0];
      for (const item of queue) if (Math.abs(entry.startTime - item.start) < Math.abs(entry.startTime - nearest.start)) nearest = item;
      nearest.done();
    }
  });
  resources.observe({type:'resource'});
  const requests = new WeakMap(), proto = page.XMLHttpRequest.prototype;
  const open = proto.open, send = proto.send;
  proto.open = function(method, url, ...args) {
    const result = Reflect.apply(open, this, [method, url, ...args]);
    requests.set(this, {method, url});
    return result;
  };
  proto.send = function(body) {
    const request = requests.get(this);
    const finish = request && start(request.url, request.method, body);
    if (finish) this.addEventListener('loadend', finish, {once:true});
    try { return Reflect.apply(send, this, arguments); }
    catch (error) {
      if (finish) { this.removeEventListener('loadend', finish); finish(); }
      throw error;
    }
  };
  function measuredFetch(fetch, receiver, args) {
    const [input, init] = args;
    const url = input?.url ?? input, method = init?.method ?? input?.method ?? 'GET';
    let body = init?.body;
    if (body == null && input instanceof page.Request && input.body && !input.bodyUsed && isZkPost(new URL(input.url), method)) {
      // fetch consumes the original Request. Parse only an observed ZK form,
      // using a clone before handing the original through unchanged.
      try { body = input.clone(); } catch { /* Locked stream: timing only. */ }
    }
    const started = page.performance.now();
    const result = Reflect.apply(fetch, receiver, args);
    const finish = start(url, method, body);
    if (finish) {
      const address = new URL(url, page.document.baseURI);
      address.hash = '';
      const key = address.href, queue = transfers.get(key) || [];
      const signal = init?.signal ?? input?.signal;
      const item = {start:started, done() {
        const index = queue.indexOf(item);
        if (index < 0) return;
        queue.splice(index, 1);
        if (!queue.length) transfers.delete(key);
        signal?.removeEventListener('abort', item.done);
        finish();
      }};
      queue.push(item); transfers.set(key, queue);
      signal?.addEventListener('abort', item.done, {once:true});
      result.then(response => { if (!response.body) item.done(); }, item.done);
    }
    return result;
  }
  let invokingFetch = false;
  function wrapFetch(fetch) {
    return function(...args) {
      // zAu._fetch may already delegate to the instrumented window.fetch.
      if (invokingFetch) return Reflect.apply(fetch, this, args);
      invokingFetch = true;
      try { return measuredFetch(fetch, this, args); }
      finally { invokingFetch = false; }
    };
  }
  const windowFetch = wrapFetch(page.fetch);
  page.fetch = windowFetch;
  let auFetch;
  function attachAuFetch() {
    const au = page.zAu, current = au?._fetch;
    if (typeof current !== 'function' || current === auFetch || current === windowFetch) return;
    const wrapped = wrapFetch(current);
    if (Reflect.set(au, '_fetch', wrapped)) auFetch = wrapped;
  }
  // ZK may bind the native fetch before Violentmonkey starts, or load its AU
  // engine later. Check at script load and before a click, without polling.
  attachAuFetch();
  page.document.addEventListener('load', event => {
    if (event.target.localName === 'script') attachAuFetch();
  }, true);
  page.addEventListener('click', attachAuFetch, {capture:true, passive:true});
  page.addEventListener('pagehide', () => {
    for (const queue of transfers.values()) for (const item of [...queue]) item.done();
    transmit('clear');
  });
}
function measure(loadCycle, history) {
  const tab = crypto.getRandomValues(new Uint32Array(1))[0];
  const state = loadCycle.create();
  let revision = 0, timer;
  function snapshot(finished = null, cancelled = false) {
    const cycle = state.cycles.get(tab);
    return {type:'easit-plus-click-loading-v2', revision, at:Date.now(), finished, cancelled,
      cycle:cycle ? {...cycle, iconPending:cycle.source === 'icon' && !!state.icons.get(tab)?.busy} : null,
      requests:cycle ? state.requestsFor(tab).map(({id, startedAt}) => ({id, startedAt})) : []};
  }
  function publish(finished, cancelled) {
    revision++;
    loadMessages.emit(snapshot(finished, cancelled));
  }
  function settle() {
    clearTimeout(timer);
    const until = state.settle(tab, Date.now());
    if (until === null) return;
    timer = setTimeout(() => {
      const cycle = state.cycles.get(tab);
      if (!cycle || state.waiting(tab)) return;
      const finished = {id:cycle.id, startedAt:cycle.startedAt, endedAt:cycle.lastAt};
      state.cycles.delete(tab);
      publish(finished);
      void locked('history', () => history.record(finished, cycle.source)).catch(() => console.warn('Easit+: kunde inte spara laddtiden.'));
    }, Math.max(0, until - Date.now()));
  }
  function receive(event) {
    const {phase, frame, id, at} = event;
    if (typeof frame !== 'string' || frame.length > 64 || !Number.isFinite(at)) return;
    if (phase === 'clear') {
      if (!state.clear(tab, frame, at)) return;
    } else {
      if (typeof id !== 'string' || id.length > 64) return;
      if (phase === 'begin') {
        const selection = event.selection === true;
        const result = state.begin({id, tabId:tab, frameId:frame, startedAt:at, selection}, event.click === true, selection);
        if (result.cancelled) { clearTimeout(timer); publish(null, true); return; }
      } else if (phase !== 'finish' || state.finish(id, at) === null) return;
    }
    if (state.cycles.has(tab)) { settle(); publish(); }
  }
  window.addEventListener('message', event => {
    if (event.origin === site && event.data?.channel === timingChannel) receive(event.data);
  });
  return {receive, clear() { clearTimeout(timer); state.clear(tab); publish(null, true); },
    command(message) {
      if (message.type === 'easit-plus-loading-icon-v1' && state.icon(tab, message.busy, Date.now())) {
        settle(); publish();
      }
      return snapshot();
    }};
}

function renderChangelog(doc) {
  const dialog = doc.querySelector('#releaseNotes'), button = doc.querySelector('#version');
  button.prepend(changelogIcon(doc));
  const section = doc.querySelector('#releaseEntries');
  function entry(release, container) {
    const list = doc.createElement('ul');
    for (const change of release.changes) {
      const item = doc.createElement('li');
      item.textContent = change;
      list.append(item);
    }
    container.append(list);
  }
  const heading = doc.createElement('h3');
  const latest = RELEASES[0];
  heading.textContent = latest ? 'Version ' + latest.version : 'Inga versionsnyheter ännu.';
  section.append(heading);
  if (latest) entry(latest, section);
  if (RELEASES.length > 1) {
    const history = doc.createElement('details'), summary = doc.createElement('summary');
    summary.textContent = 'Äldre versioner';
    history.append(summary);
    for (const release of RELEASES.slice(1)) {
      const details = doc.createElement('details'), label = doc.createElement('summary');
      label.textContent = release.version + ' – ' + release.date;
      details.append(label);
      entry(release, details);
      history.append(details);
    }
    section.append(history);
  }
  function open() {
    if (!dialog.open) dialog.showModal();
  }
  button.addEventListener('click', open);
  return open;
}
function checkVersion(scope) {
  const key = 'lastSeenUserscriptVersion';
  return locked('storage', async () => {
    const previous = GM_getValue(key, '');
    if (previous && VERSION.localeCompare(previous, 'en', {numeric:true}) <= 0) return;
    if (previous) {
      const card = document.createElement('section');
      card.className = 'easit-plus-release-notice';
      card.setAttribute('data-easit-plus-local-ui', '');
      card.setAttribute('role', 'status');
      const heading = document.createElement('strong');
      heading.textContent = 'Easit+ har uppdaterats till ' + VERSION;
      const show = document.createElement('button'), close = document.createElement('button');
      show.className = 'easit-plus-release-history';
      show.title = 'Visa ändringslogg';
      show.setAttribute('aria-label', show.title);
      show.append(changelogIcon(document));
      close.className = 'easit-plus-loading-close';
      close.title = 'Stäng uppdateringsnotisen';
      close.setAttribute('aria-label', close.title);
      show.type = close.type = 'button';
      show.addEventListener('click', () => { scope.openChangelog(); card.remove(); });
      close.addEventListener('click', () => card.remove());
      card.append(noticeCheck(document), heading, show, close);
      scope.EasitPlusFeedback.mountNotice(card);
    }
    await commitGroups({[key]:VERSION});
  });
}

function moduleContext(page, modules, api) {
  return {
    window:page, document:page.document, location:page.location, globalThis:modules, api,
    Element:page.Element, Node:page.Node, HTMLElement:page.HTMLElement,
    HTMLInputElement:page.HTMLInputElement, HTMLTextAreaElement:page.HTMLTextAreaElement,
    HTMLLinkElement:page.HTMLLinkElement, Event:page.Event, CustomEvent:page.CustomEvent,
    MutationObserver:page.MutationObserver, getComputedStyle:page.getComputedStyle.bind(page),
    matchMedia:page.matchMedia.bind(page), requestAnimationFrame:page.requestAnimationFrame.bind(page),
    cancelAnimationFrame:page.cancelAnimationFrame.bind(page)
  };
}
function mountPopup(frame, notifyHeader, parentModules) {
  const cleanup = [];
  const dispose = () => { for (const fn of cleanup.splice(0)) fn(); };
  let openNotes;
  frame.addEventListener('load', () => {
    dispose();
    const page = frame.contentWindow;
    if (!page || frame.contentDocument?.URL !== 'about:srcdoc') return;
    const modules = {};
    const ctx = moduleContext(page, modules, platform(true, cleanup));
    ctx.postToHeader = notifyHeader;
    ctx.copyFeedback = () => parentModules.EasitPlusFeedback.showCopy();
    ctx.reloadPopup = () => { frame.srcdoc = POPUP_HTML; };
    for (const initialize of POPUP_MODULES) initialize(ctx);
    openNotes = renderChangelog(page.document);
    page.addEventListener('pagehide', dispose, {once:true});
  });
  frame.srcdoc = POPUP_HTML;
  return {dispose, openNotes:() => openNotes?.()};
}
let network;
const page = unsafeWindow;
if (page.location.origin === site) {
  const modules = {}, cleanup = [];
  const api = platform(false, cleanup);
  const ctx = moduleContext(page, modules, api);
  const services = {...ctx, api:{...api, messages:messageHandlers}};
  initNotes(ctx);
  initExclusions(services);
  initNoteEdits(services);
  if (page === page.top) {
    initLoadCycle(ctx);
    initLoadHistory(ctx);
    network = measure(modules.EasitPlusLoadCycle, modules.EasitPlusLoadHistory);
  }
  observeRequests(page);
  const style = document.createElement('style');
  style.textContent = PAGE_CSS;
  (document.head || document.documentElement).append(style);
  for (const initialize of PAGE_MODULES) initialize(ctx);
  if (page === page.top) void checkVersion(modules);
}

})();
