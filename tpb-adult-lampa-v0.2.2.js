/*
 * TPB Adult -> Lampa bridge
 * Version: 0.2.3
 *
 * Based on working v0.2.0
 *
 * Fixes:
 * - correct InteractionCategory lifecycle
 * - no manual comp.start()/comp.create() recursion
 * - correct activity loader access
 * - vertical catalog scrolling/focus is left to Lampa InteractionCategory
 * - fixed infinite pagination
 * - pagination continues until TPB returns an empty page
 * - meta/stream requests use the same configured base as the catalog
 * - all 6 configured TPB bases are preserved
 * - TPB Adult remains in the sidebar menu
 * - no Lampa.Listener.trigger()
 * - no single-item playlist reset when starting a stream
 *
 * ES5, no external dependencies.
 */

(function () {
    'use strict';

    var PLUGIN_ID = 'tpb_adult_lampa';
    var VERSION = '0.2.3';

    /*
     * Six configured TPB addon groups.
     *
     * IMPORTANT:
     * Keep these URLs exactly as configured in your working v0.2.0.
     */

    var DEFAULT_BASE = [
        'https://tpb-adult-addon.click/pornrips/hentai/pjav/stripchat/yesporn/pornwex',
        'https://tpb-adult-addon.click/pimpbunny/koreanbj/xhamster/hdporngg/porntrex/freshporno/bingato',
        'https://tpb-adult-addon.click/eporner/vjav/xvideos/gnxx/sxyland/youperv',
        'https://tpb-adult-addon.click/superporn/fullvideosporn/pornhub/notfans/hornyfap/severeporn/hlintahentaismile/megapacks',
        'https://tpb-adult-addon.click/shareanynudes/xxbrits/hentaigasm/xmaza/hindixxxhd/webxseries/wowuncut/yespornpleasexx',
        'https://tpb-adult-addon.click/hotleak'
    ];

    function getBase(index) {
        index = typeof index === 'number' ? index : 0;

        var key = PLUGIN_ID + '_url';

        try {
            var stored = Lampa.Storage.get(key + '_' + index, '');

            if (stored) {
                return String(stored).replace(/\/+$/, '');
            }
        } catch (e) {}

        return String(DEFAULT_BASE[index] || DEFAULT_BASE[0]).replace(/\/+$/, '');
    }

    function request(url, success, fail) {
        new Lampa.Reguest().silent(
            url,
            success,
            fail,
            false
        );
    }

    function json(data) {
        if (typeof data === 'object') {
            return data;
        }

        try {
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }

    function enc(value) {
        return encodeURIComponent(value == null ? '' : String(value));
    }

    /*
     * ---------------------------------------------------------
     * MANIFEST
     * ---------------------------------------------------------
     */

    function getManifest(callback, fail) {
        var all = [];
        var completed = 0;
        var failed = 0;

        for (var i = 0; i < DEFAULT_BASE.length; i++) {
            (function (index) {
                var url = getBase(index) + '/manifest.json';

                request(url, function (data) {
                    var manifest = json(data);
                    var catalogs = manifest.catalogs || [];

                    for (var j = 0; j < catalogs.length; j++) {
                        catalogs[j]._base_index = index;
                    }

                    all = all.concat(catalogs);

                    completed++;

                    if (completed + failed >= DEFAULT_BASE.length) {
                        if (all.length) {
                            callback({
                                catalogs: all
                            });
                        } else if (fail) {
                            fail(new Error('No TPB catalogs available'));
                        }
                    }
                }, function (err) {
                    failed++;

                    if (completed + failed >= DEFAULT_BASE.length) {
                        if (all.length) {
                            callback({
                                catalogs: all
                            });
                        } else if (fail) {
                            fail(err || new Error('TPB Adult unavailable'));
                        }
                    }
                });
            })(i);
        }
    }

    /*
     * ---------------------------------------------------------
     * URL BUILDERS
     * ---------------------------------------------------------
     */

    function catalogUrl(cat, extra) {
        var baseIndex =
            typeof cat._base_index === 'number'
                ? cat._base_index
                : 0;

        var base = getBase(baseIndex);

        var url =
            base +
            '/catalog/' +
            enc(cat.type) +
            '/' +
            enc(cat.id);

        extra = extra || {};

        var parts = [];

        Object.keys(extra).forEach(function (key) {
            if (
                extra[key] !== undefined &&
                extra[key] !== null &&
                extra[key] !== ''
            ) {
                parts.push(
                    enc(key) + '=' + enc(extra[key])
                );
            }
        });

        if (parts.length) {
            url += '/' + parts.join('/');
        }

        url += '.json';

        return url;
    }

    function metaUrl(meta, type, id, baseIndex) {
        var index =
            typeof baseIndex === 'number'
                ? baseIndex
                : 0;

        return (
            getBase(index) +
            '/meta/' +
            enc(type) +
            '/' +
            enc(id) +
            '.json'
        );
    }

    function streamUrl(type, id, baseIndex) {
        var index =
            typeof baseIndex === 'number'
                ? baseIndex
                : 0;

        return (
            getBase(index) +
            '/stream/' +
            enc(type) +
            '/' +
            enc(id) +
            '.json'
        );
    }

    /*
     * ---------------------------------------------------------
     * NORMALIZE META
     * ---------------------------------------------------------
     */

    function normalizeMeta(item, type, baseIndex) {
        item = item || {};

        item.tpb_addon_id =
            item.tpb_addon_id ||
            item.id ||
            '';

        item.tpb_addon_type =
            item.tpb_addon_type ||
            type ||
            'movie';

        item.tpb_base_index =
            typeof baseIndex === 'number'
                ? baseIndex
                : 0;

        return item;
    }

    /*
     * ---------------------------------------------------------
     * STREAM
     * ---------------------------------------------------------
     */

    function playStream(entry) {
        if (!entry) return;

        /*
         * Do NOT reset playlist here.
         * Lampa.Player.play() handles playback.
         */
        Lampa.Player.play(entry);
    }

    function showStreams(movie, type, id, baseIndex) {
        var url = streamUrl(type, id, baseIndex);

        request(url, function (data) {
            var result = json(data);
            var streams = result.streams || [];

            if (!streams.length) {
                Lampa.Noty.show(
                    'TPB Adult: потоки не найдены'
                );
                return;
            }

            var items = [];

            streams.forEach(function (stream, index) {
                var title =
                    stream.title ||
                    stream.name ||
                    ('Stream ' + (index + 1));

                items.push({
                    title: title,
                    url: stream.url || stream.externalUrl || '',
                    quality: stream.quality || '',
                    type: stream.type || 'video'
                });
            });

            var activity = new Lampa.Activity();

            activity.loader(false);

            var comp = new Lampa.Select({
                title: 'TPB Adult',
                items: items,
                onSelect: function (item) {
                    if (item && item.url) {
                        playStream({
                            url: item.url,
                            title: item.title,
                            quality: item.quality
                        });
                    }
                }
            });

            activity.component = comp;

            Lampa.Activity.push(
                activity
            );
        }, function () {
            Lampa.Noty.show(
                'TPB Adult: ошибка загрузки потоков'
            );
        });
    }

    /*
     * ---------------------------------------------------------
     * META
     * ---------------------------------------------------------
     */

    function openMeta(element) {
        var movie = element.movie || element;

        var id =
            movie.tpb_addon_id ||
            movie.id ||
            '';

        var type =
            movie.tpb_addon_type ||
            movie.type ||
            'movie';

        var baseIndex =
            typeof movie.tpb_base_index === 'number'
                ? movie.tpb_base_index
                : 0;

        if (!id) {
            Lampa.Noty.show(
                'TPB Adult: отсутствует ID'
            );
            return;
        }

        request(
            metaUrl(
                movie,
                type,
                id,
                baseIndex
            ),
            function (data) {
                var meta = json(data);

                if (!meta || !meta.meta) {
                    showStreams(
                        movie,
                        type,
                        id,
                        baseIndex
                    );
                    return;
                }

                meta.meta.tpb_addon_id = id;
                meta.meta.tpb_addon_type = type;
                meta.meta.tpb_base_index = baseIndex;

                Lampa.Activity.push({
                    component: 'tpb_adult_card',
                    movie: meta.meta
                });
            },
            function () {
                showStreams(
                    movie,
                    type,
                    id,
                    baseIndex
                );
            }
        );
    }

    /*
     * ---------------------------------------------------------
     * CARD
     * ---------------------------------------------------------
     */

    function TpbCard(object) {
        var activity = this.activity;
        var movie = object.movie || {};

        this.create = function () {
            var self = this;

            var button = $(
                '<div class="selector button--secondary">' +
                    '<span>Смотреть</span>' +
                '</div>'
            );

            button.on(
                'hover:enter',
                function () {
                    showStreams(
                        movie,
                        movie.tpb_addon_type ||
                            movie.type ||
                            'movie',
                        movie.tpb_addon_id ||
                            movie.id ||
                            '',
                        typeof movie.tpb_base_index ===
                            'number'
                            ? movie.tpb_base_index
                            : 0
                    );
                }
            );

            activity.render().append(button);

            self.activity.toggle();
        };

        this.start = function () {
            this.create();

            activity.controller.add(
                'content',
                activity.render().find('.selector')
            );

            activity.controller.toggle('content');

            activity.onBack = function () {
                Lampa.Activity.backward();
            };
        };
    }

    /*
     * ---------------------------------------------------------
     * CATALOG
     * ---------------------------------------------------------
     */

    function TpbCatalog(object) {
        var comp =
            new Lampa.InteractionCategory(object);

        var catalog = object.catalog || {};
        var search = object.search || '';

        var pageSize = 20;

        var currentPage =
            parseInt(
                object.page || 1,
                10
            );

        /*
         * IMPORTANT:
         *
         * Lampa's legacy InteractionCategory checks
         * total_pages before requesting the next page.
         *
         * TPB does not provide a reliable total_pages value.
         * Therefore allow pagination until TPB returns [].
         */
        comp.total_pages = 999999;

        function loadPage(
            page,
            callback,
            fail
        ) {
            var extra = {
                skip:
                    (page - 1) *
                    pageSize
            };

            if (search) {
                extra.search = search;
            }

            request(
                catalogUrl(
                    catalog,
                    extra
                ),
                function (data) {
                    var result = json(data);
                    var metas =
                        result.metas || [];

                    callback(metas);
                },
                fail
            );
        }

        /*
         * First page.
         *
         * DO NOT override comp.start().
         * InteractionCategory owns its lifecycle.
         */
        comp.create = function () {
            var activity = this.activity;
            var self = this;

            if (
                activity &&
                typeof activity.loader ===
                    'function'
            ) {
                activity.loader(true);
            }

            loadPage(
                currentPage,
                function (metas) {
                    var items =
                        metas.map(
                            function (item) {
                                return normalizeMeta(
                                    item,
                                    catalog.type,
                                    typeof catalog._base_index ===
                                        'number'
                                        ? catalog._base_index
                                        : 0
                                );
                            }
                        );

                    self.build({
                        results: items,

                        /*
                         * Continue while TPB
                         * returns at least one item.
                         */
                        more:
                            metas.length > 0,

                        collection: true
                    });

                    if (
                        activity &&
                        typeof activity.loader ===
                            'function'
                    ) {
                        activity.loader(false);
                    }
                },
                function () {
                    if (
                        activity &&
                        typeof activity.loader ===
                            'function'
                    ) {
                        activity.loader(false);
                    }

                    Lampa.Noty.show(
                        'TPB Adult: каталог недоступен'
                    );
                }
            );
        };

        /*
         * Card click.
         */
        comp.cardRender = function (
            object,
            element,
            card
        ) {
            card.onEnter = function () {
                openMeta(element);
            };
        };

        /*
         * -----------------------------------------------------
         * FIXED PAGINATION
         * -----------------------------------------------------
         *
         * InteractionCategory passes nextObject.page.
         *
         * We use it when available and fall back to
         * currentPage + 1.
         *
         * TPB pagination:
         *
         * page 1 -> skip=0
         * page 2 -> skip=20
         * page 3 -> skip=40
         * page 4 -> skip=60
         * ...
         *
         * Loading stops only when TPB returns an empty page.
         */
        comp.nextPageReuest = function (
            nextObject,
            resolve,
            reject
        ) {
            var nextPage =
                nextObject &&
                parseInt(
                    nextObject.page,
                    10
                );

            if (
                !nextPage ||
                nextPage <= currentPage
            ) {
                nextPage =
                    currentPage + 1;
            }

            loadPage(
                nextPage,
                function (metas) {
                    currentPage =
                        nextPage;

                    var results =
                        metas.map(
                            function (item) {
                                return normalizeMeta(
                                    item,
                                    catalog.type,
                                    typeof catalog._base_index ===
                                        'number'
                                        ? catalog._base_index
                                        : 0
                                );
                            }
                        );

                    resolve({
                        results: results,

                        /*
                         * If TPB returned any items,
                         * allow another request.
                         *
                         * If TPB returned [],
                         * InteractionCategory stops.
                         */
                        more:
                            metas.length > 0
                    });
                },
                function (err) {
                    if (reject) {
                        reject(err);
                    } else {
                        resolve({
                            results: [],
                            more: false
                        });
                    }
                }
            );
        };

        return comp;
    }

    /*
     * ---------------------------------------------------------
     * MENU
     * ---------------------------------------------------------
     */

    function addMenu() {
        if (
            !Lampa.Menu ||
            typeof Lampa.Menu.addButton !==
                'function'
        ) {
            return;
        }

        Lampa.Menu.addButton(
            'TPB Adult',
            'menu-tpb-adult',
            function () {
                getManifest(
                    function (manifest) {
                        var catalogs =
                            manifest.catalogs ||
                            [];

                        if (!catalogs.length) {
                            Lampa.Noty.show(
                                'TPB Adult: каталоги не найдены'
                            );
                            return;
                        }

                        var items =
                            catalogs.map(
                                function (
                                    catalog
                                ) {
                                    return {
                                        title:
                                            catalog.name ||
                                            catalog.title ||
                                            catalog.id,

                                        catalog:
                                            catalog
                                    };
                                }
                      
