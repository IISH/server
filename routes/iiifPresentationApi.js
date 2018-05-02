const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const pool = require('../helpers/DB');
const manifestBuilder = require('../helpers/ManifestBuilder');

/* GET users listing. */
router.get('/iiif/v2/manifest/:id', show);
router.get('/ifff/v2/:id/manifest.json', show);

function show(req, res) {

    let manifestPath = './cache/iiif/v2/manifest/'+req.params.id+'.json';

    fs.readFile(manifestPath, 'utf8', function (err, fileData) {
        if(err) {

            let sql =
                "SELECT a.id as id, a.type as type, a.parent_id, " +
                "a.original_name as original_name, a.original_pronom as original_pronom, " +
                "a.access_resolver as access_resolver, a.access_pronom as access_pronom, " +
                "b.id as child_id , b.type as child_type, " +
                "b.original_name as child_original_name, b.original_pronom as child_original_pronom, " +
                "b.access_resolver as child_access_resolver " +
                "FROM manifest as a " +
                "LEFT JOIN manifest as b ON a.id = b.parent_id " +
                "WHERE a.id = $1;";

            pool.query(sql, [req.params.id], function (err, data) {
                if (err) {
                    res.status(404);
                    res.send({ error: 'Not found 1' });
                    return;
                }

                if (data.rows.length === 0) {
                    res.status(404);
                    res.send({ error: 'Not found 2' });
                    return;
                }

                let manifest = new manifestBuilder();
                let output = manifest.get(data.rows);

                res.send(output);

                let dirName = path.dirname(manifestPath);
                if (fs.existsSync(dirName)){
                    fs.writeFile(manifestPath, JSON.stringify(output), function () {});
                } else {
                    mkdirp(dirName, function (err) {
                        if (!err) {
                            fs.writeFile(manifestPath, JSON.stringify(output), function () {});
                        }
                    });
                }

            });

        } else {

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.send(fileData);

        }
    });


}

module.exports = router;
