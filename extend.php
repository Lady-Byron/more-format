<?php

namespace LadyByron\MoreFormat;

use Flarum\Extend;
use s9e\TextFormatter\Configurator;

return [
    // 前端资源：只在这里注入一次
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js'),

    // 语言包
    new Extend\Locales(__DIR__.'/resources/locale'),

    // 注册 BBCode：居中 / 右对齐
    (new Extend\Formatter)->configure(function (Configurator $config) {
        // 方案A：使用 align（浏览器仍支持）
        // $config->BBCodes->addCustom('[center]{TEXT}[/center]', '<div align="center">{TEXT}</div>');
        // $config->BBCodes->addCustom('[right]{TEXT}[/right]',   '<div align="right">{TEXT}</div>');

        // 方案B（推荐）：使用 style，更“现代”
        $config->BBCodes->addCustom('[center]{TEXT}[/center]', '<div style="text-align:center">{TEXT}</div>');
        $config->BBCodes->addCustom('[right]{TEXT}[/right]',   '<div style="text-align:right">{TEXT}</div>');
    }),
];

