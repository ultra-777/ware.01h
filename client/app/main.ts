/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />

import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { RootModuleNgFactory } from '../../temp/app/module/default.module.ngfactory';

let isDebug: boolean = false;
// conditional_compilation_anchor	isDebug = true;
if (!isDebug) {
	enableProdMode();
}

platformBrowser().bootstrapModuleFactory(RootModuleNgFactory);
