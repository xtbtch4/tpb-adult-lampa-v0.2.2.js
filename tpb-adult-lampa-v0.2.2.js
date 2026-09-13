(function () {
    'use strict';

    var VERSION = '0.2.3';
    var PLUGIN_NAME = 'TPB Adult';

    /*
     * TPB Adult -> Lampa bridge
     *
     * v0.2.3
     * - fixes infinite-scroll pagination for legacy Lampa InteractionCategory
     * - sets a large total_pages value required by legacy next-page module
     * - uses nextObject.page when available
     * - keeps the catalog source/base index between pages
     * - does not override InteractionCategory.start()
     * - keeps single-stream playback without playlist reset
     * - restores all 6 original TPB source bases
     * - does not use unsupported Lampa.Listener.trigger()
     * - uses TPB/Stremio path-style pagination URLs
     */

    var DEFAULT_BASE = [
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicG9ybnJpcHMiLCJoZW50YWkiLCJwamF2Iiwic3RyaXBjaGF0IiwieWVzcG9ybiIsInBvcm53ZXgiXSwidGJLZXkiOiJhNWVjZmJiZC1mNDRlLTQ3MWUtODA0MC1iYWY4MWRmYzQyODIiLCJkaXNhYmxlZENhdGFsb2dzIjpbInNjX2d1eXMiLCJzY190cmFucyIsInNjX3VzYSIsInNjX3NvdXRoX2FtZXJpY2EiLCJzY19ldXJvcGUiLCJzY19hc2lhIiwic2NfaW5kaWEiLCJzY19vY2VhbmlhIl0sInRwZGJDYXRlZ29yaWVzIjpbXSwic3Rhc2hkYkNhdGVnb3JpZXMiOltdLCJncm91cCI6MSwiZ3JvdXBUb3RhbCI6Nn0',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicGltcGJ1bm55Iiwia29yZWFuYmoiLCJ4aGFtc3RlciIsImhkcG9ybmdnIiwicG9ybnRyZXgiLCJmcmVzaHBvcm5vIiwiYmluZ2F0byJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDQwLWJhZjgxZGZjNDI4MiIsInRwZGJDYXRlZ29yaWVlcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjIsImdyb3VwVG90YWwiOjZ9',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiZXBvcm5lciIsInZqYXYiLCJ4dmlkZW9zIiwieG54eCIsInN4eWxhbmQiLCJ5b3VwZXJ2Il0sInRiS2V5IjoiYTVlY2ZiYmQtZjQ0ZS00NzFlLTgwNDAtYmFmODFkZmM0MjgyIiwidHBkYkNhdGVnb3JpZXMiOltdLCJzdGFzaGRiQ2F0ZWdvcmllcyI6W10sImdyb3VwIjozLCJncm91cFRvdGFsIjo2fQ',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic3VwZXJwb3JuIiwiZnVsbHZpZGVvc3Bvcm4iLCJwb3JuaHViIiwibm90ZmFucyIsImhvcm55ZmFwIiwic2V2ZXJlcG9ybiIsImhlbnRhaXNtaWxlIiwibWVnYXBhY2tzIl0sInRiS2V5IjoiYTVlY2ZiYmQtZjQ0ZS00NzFlLTgwNDAtYmFmODFkZmM0MjgyIiwidHBkYkNhdGVnb3JpZXMiOltdLCJzdGFzaGRiQ2F0ZWdvcmllcyI6W10sImdyb3VwIjo0LCJncm91cFRvdGFsIjo2fQ',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic2hhcmVhbnludWRlcyIsInh4YnJpdHMiLCJoZW50YWlnYXNtIiwieG1hemEiLCJoaW5kaXh4eGhkIiwid2VieHNlcmllcyIsIndvd3VuY3V0IiwieWVzcG9ybnBsZWFzZXh4eCJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDQwLWJhZjgxZGZjNDI4MiIsInRwZGJDYXRlZ29yaWVzIjpbXSwic3Rhc2hkYkNhdGVnb3JpZXMiOltdLCJncm91cCI6NSwiZ3JvdXBUb3RhbCI6Nn0',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJldmFybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiaG90bGVhayJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDQwLWJhZjgxZGZjNDI4MiIsInRwZGJDYXRlZ29yaWVzIjpbXSwic3Rhc2hkYkNhdGVnb3JpZXMiOltdLCJncm91cCI6NiwiZ3JvdXBUb3RhbCI6Nn0'
    ];

    function cleanBase(url) {
        return String(url || '').replace(/\/+$/, '');
    }

    function getBase(index) {
        index = typeof index === 'number' ? index : 0;

        var stored = Lampa.Storage.get('tpb_adult_base', '');
        if (stored) {
            return cleanBase(stored);
        }

        return cleanBase(DEFAULT_BASE[index] || DEFAULT_BASE[0]);
    }

    function request(url, success, fail) {
        var req = new Lampa.Reguest();

        req.timeout = 15000;

        req.native(
            url,
            function (data) {
                success(data);
            },
            function (error) {
                if (fail) {
                    fail(error);
                }
            }
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

    function encode(value) {
        return encodeURIComponent(
            value == null ? '' : String(value)
        );
    }

    function addParams(url, params) {
        var parts = [];
        var key;

        for (key in params) {
            if (
                Object.prototype.hasOwnProperty.call(params, key) &&
                params[key] !== undefined &&
                params[key] !== null &&
                params[key] !== ''
            ) {
                parts.push(
                    encode(key) + '=' + encode(params[key])
                );
            }
        }

        if (parts.length) {
            url += '/' + parts.join('/');
        }

        return url + '.json';
    }

    function getManifest(baseIndex, success, fail) {
        request(
            getBase(baseIndex) + '/manifest.json',
            function (data) {
                var manifest = json(data);

                manifest = manifest || {};
                manifest.catalogs = manifest.catalogs || [];

                success(manifest);
            },
            fail
        );
    }

    function catalogUrl(catalog, page, search) {
        var baseIndex =
            typeof catalog._base_index === 'number'
                ? catalog._base_index
                : 0;

        var url =
            getBase(baseIndex) +
            '/catalog/' +
            encode(catalog.type || 'movie') +
            '/' +
            encode(catalog.id || '');

        var extra = {
            skip: (page - 1) * 20
        };

        if (search) {
            extra.search = search;
        }

        return addParams(url, extra);
    }

    function metaUrl(type, id, baseIndex) {
        return (
            getBase(baseIndex) +
            '/meta/' +
            encode(type || 'movie') +
            '/' +
            encode(id || '') +
            '.json'
        );
    }

    function streamUrl(type, id, baseIndex) {
        return (
            getBase(baseIndex) +
            '/stream/' +
            encode(type || 'movie') +
            '/' +
            encode(id || '') +
            '.json'
        );
    }

    function normalizeMeta(item, type, baseIndex) {
        item = item || {};

        var result = {
            id: item.id,
            type: item.type || type || 'movie',
            name: item.name || item.title || '',
            title: item.title || item.name || '',
            poster: item.poster || item.background || '',
            background: item.background || item.poster || '',
            description: item.description || item.overview || '',
            releaseInfo: item.releaseInfo || item.year || '',
            year: item.year || '',
            genres: item.genres || [],
            imdbRating: item.imdbRating || item.rating || 0,
            runtime: item.runtime || 0,
            videos: item.videos || []
        };

        result.tpb_base_index = baseIndex;

        return result;
    }

    function openMeta(element) {
        var movie = element && element.movie;

        if (!movie) {
            return;
        }

        Lampa.Activity.push({
            url: '',
            title: movie.title || movie.name || '',
            component: 'tpb_card',
            movie: movie
        });
    }

    function TpbCard(object) {
        var comp = new Lampa.InteractionMain(object);
        var movie = object.movie || {};

        comp.create = function () {
            var self = this;
            var activity = this.activity;

            if (
                activity &&
                typeof activity.loader === 'function'
            ) {
                activity.loader(true);
            }

            request(
                metaUrl(
                    movie.type,
                    movie.id,
                    typeof movie.tpb_base_index === 'number'
                        ? movie.tpb_base_index
                        : 0
                ),
                function (data) {
                    var result = json(data);
                    var meta = result.meta || result;

                    self.render = function () {
                        var body = $(
                            '<div class="tpb-adult-card"></div>'
                        );

                        body.append(
                            $(
                                '<div class="tpb-adult-card__title"></div>'
                            ).text(
                                meta.name ||
                                meta.title ||
                                movie.title ||
                                ''
                            )
                        );

                        if (
                            meta.description ||
                            meta.overview
                        ) {
                            body.append(
                                $(
                                    '<div class="tpb-adult-card__description"></div>'
                                ).text(
                                    meta.description ||
                                    meta.overview
                                )
                            );
                        }

                        return body;
                    };

                    self.activity
                        .render()
                        .find('.activity__body')
                        .append(self.render());

                    if (
                        activity &&
                        typeof activity.loader === 'function'
                    ) {
                        activity.loader(false);
                    }

                    loadStreams(meta, movie);
                },
                function () {
                    if (
                        activity &&
                        typeof activity.loader === 'function'
                    ) {
                        activity.loader(false);
                    }

                    Lampa.Noty.show(
                        'TPB Adult: информация недоступна'
                    );
                }
            );
        };

        function loadStreams(meta, sourceMovie) {
            var type =
                meta.type ||
                sourceMovie.type ||
                'movie';

            var id =
                meta.id ||
                sourceMovie.id;

            var baseIndex =
                typeof sourceMovie.tpb_base_index === 'number'
                    ? sourceMovie.tpb_base_index
                    : 0;

            request(
                streamUrl(type, id, baseIndex),
                function (data) {
                    var result = json(data);
                    var streams = result.streams || [];

                    streams.forEach(function (stream) {
                        stream.title =
                            stream.title ||
                            stream.name ||
                            (
                                stream.behaviorHints &&
                                stream.behaviorHints.filename
                            ) ||
                            'TPB Adult';

                        stream.url =
                            stream.url ||
                            stream.externalUrl;

                        if (stream.url) {
                            addStreamButton(stream);
                        }
                    });
                }
            );
        }

        function addStreamButton(stream) {
            var body = comp.activity
                .render()
                .find('.activity__body');

            var button = $(
                '<div class="selector button--medium button--wide">' +
                '<span class="tpb-stream-title"></span>' +
                '</div>'
            );

            button
                .find('.tpb-stream-title')
                .text(stream.title);

            button.on(
                'hover:enter',
                function () {
                    playStream(stream);
                }
            );

            body.append(button);
        }

        return comp;
    }

    function playStream(stream) {
        var entry = {
            url: stream.url,
            title: stream.title || 'TPB Adult',
            quality: stream.quality,
            bitrate: stream.bitrate,
            size: stream.size,
            timeline: stream.timeline,
            subtitles: stream.subtitles,
            audio: stream.audio,
            headers: stream.headers
        };

        Lampa.Player.play(entry);
    }

    function TpbCatalog(object) {
        var comp = new Lampa.InteractionCategory(object);

        var catalog = object.catalog || {};
        var search = object.search || '';

        var PAGE_SIZE = 20;

        var initialPage =
            parseInt(object.page || 1, 10);

        if (!initialPage || initialPage < 1) {
            initialPage = 1;
        }

        var currentPage = initialPage;
        var loadingPage = 0;

        /*
         * IMPORTANT FOR LEGACY LAMPA
         *
         * Old InteractionCategory next-page module checks:
         *
         * object.page < total_pages
         *
         * Some TPB/Stremio catalogs don't expose a useful
         * total_pages value. Therefore we give Lampa a large
         * upper limit and use an empty response as the real
         * end-of-list signal.
         */
        comp.total_pages = 999999;

        function loadPage(page, callback, fail) {
            if (loadingPage === page) {
                return;
            }

            loadingPage = page;

            request(
                catalogUrl(
                    catalog,
                    page,
                    search
                ),
                function (data) {
                    loadingPage = 0;

                    var result = json(data);
                    var metas = result.metas || [];

                    callback(metas, result);
                },
                function (error) {
                    loadingPage = 0;

                    if (fail) {
                        fail(error);
                    }
                }
            );
        }

        comp.create = function () {
            var activity = this.activity;
            var self = this;

            if (
                activity &&
                typeof activity.loader === 'function'
            ) {
                activity.loader(true);
            }

            loadPage(
                currentPage,
                function (metas) {
                    var items = metas.map(
                        function (item) {
                            return normalizeMeta(
                                item,
                                catalog.type,
                                typeof catalog._base_index === 'number'
                                    ? catalog._base_index
                                    : 0
                            );
                        }
                    );

                    /*
                     * Do not override comp.start().
                     *
                     * InteractionCategory needs its own
                     * lifecycle/controller for vertical
                     * navigation and infinite scroll.
                     *
                     * more=true is deliberately used here.
                     */
                    self.build({
                        results: items,
                        more: metas.length > 0,
                        collection: true
                    });

                    if (
                        activity &&
                        typeof activity.loader === 'function'
                    ) {
                        activity.loader(false);
                    }
                },
                function () {
                    if (
                        activity &&
                        typeof activity.loader === 'function'
                    ) {
                        activity.loader(false);
                    }

                    Lampa.Noty.show(
                        'TPB Adult: каталог недоступен'
                    );

                    self.build({
                        results: [],
                        more: false,
                        collection: true
                    });
                }
            );
        };

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
         * Legacy Lampa API deliberately calls this
         * "Reuest".
         *
         * The nextObject supplied by InteractionCategory
         * may contain the page it wants us to load.
         */
        comp.nextPageReuest = function (
            nextObject,
            resolve,
            reject
        ) {
            nextObject = nextObject || {};

            var nextPage = parseInt(
                nextObject.page ||
                nextObject.next_page ||
                nextObject.nextPage ||
                (currentPage + 1),
                10
            );

            /*
             * Prevent duplicate or backward requests.
             */
            if (
                !nextPage ||
                nextPage <= currentPage
            ) {
                nextPage = currentPage + 1;
            }

            loadPage(
                nextPage,
                function (metas) {
                    currentPage = nextPage;

                    var items = metas.map(
                        function (item) {
                            return normalizeMeta(
                                item,
                                catalog.type,
                                typeof catalog._base_index === 'number'
                                    ? catalog._base_index
                                    : 0
                            );
                        }
                    );

                    /*
                     * If TPB returned records, tell Lampa that
                     * another page may exist.
                     *
                     * When TPB finally returns an empty page,
                     * more=false stops the infinite scroll.
                     */
                    resolve(
