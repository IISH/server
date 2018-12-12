const {createReadStream} = require('fs');
const Router = require('koa-router');
const send = require('koa-send');

const config = require('../lib/Config');
const HttpError = require('../lib/HttpError');
const {fileIconsPath} = require('../lib/FileIcon');

const router = new Router();

router.use(async (ctx, next) => {
    try {
        await next();
    }
    catch (e) {
        throw new HttpError(404, 'Not found');
    }
});

router.get('/file-icon:path(.*)', async ctx => {
    await send(ctx, ctx.params.path, {root: fileIconsPath});
});

router.get('/archivalviewer:path(.*)?', async ctx => {
    if (!ctx.params.path)
        return ctx.redirect(`/archivalviewer/${ctx.search}`);

    await send(ctx, ctx.params.path, {root: config.archivalViewerPath, index: 'index.html'});
});

router.get('/universalviewer:path(.*)?', async ctx => {
    if (!ctx.params.path || (ctx.params.path === '/'))
        return await send(ctx, '/src/static/universalviewer.html');

    if (ctx.params.path === '/uv-config.json') {
        ctx.body = createReadStream(config.universalViewerConfigPath);
        return;
    }

    await send(ctx, ctx.params.path, {root: config.universalViewerPath});
});

module.exports = router;
