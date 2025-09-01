<?php

namespace LadyByron\MoreFormat;

use Flarum\Extend;
use s9e\TextFormatter\Configurator;

return [
    // 前端资源
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js'),

    // 语言包
    new Extend\Locales(__DIR__.'/resources/locale'),

    // 注册 BBCode：居中 / 右对齐
    (new Extend\Formatter)->configure(function (Configurator $config) {
        // 最简：用 align 属性（无需额外 CSS）
        $config->BBCodes->addCustom('[center]{TEXT}[/center]', '<div align="center">{TEXT}</div>');
        $config->BBCodes->addCustom('[right]{TEXT}[/right]',   '<div align="right">{TEXT}</div>');
    }),
];
