<?php

namespace LadyByron\MoreFormat;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))->js(__DIR__.'/js/dist/forum.js'),
    new Extend\Locales(__DIR__.'/resources/locale'),
];
