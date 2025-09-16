<?php

namespace LadyByron\MoreFormat;

use Flarum\Extend;
use s9e\TextFormatter\Configurator;

return [
    // 注入前端 JS + 本扩展样式
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    new Extend\Locales(__DIR__.'/resources/locale'),

    // 用 <span> 包裹，避免在 H1–H5 中非法；具体对齐交给样式
    (new Extend\Formatter)->configure(function (Configurator $config) {
        $config->BBCodes->addCustom(
            '[center]{TEXT}[/center]',
            '<span class="lb-align-center">{TEXT}</span>'
        );
        $config->BBCodes->addCustom(
            '[right]{TEXT}[/right]',
            '<span class="lb-align-right">{TEXT}</span>'
        );
    }),
];
