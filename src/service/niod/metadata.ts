import readline from 'readline';

import {join} from 'path';
import {createReadStream, existsSync} from 'fs';

import config from '../../lib/Config';
import logger from '../../lib/Logger';
import {MetadataParams} from '../../lib/Service';
import {MinimalItem} from '../../lib/ItemInterfaces';
import {getCollectionIdsIndexed, updateItems} from '../../lib/Item';

import * as NIOD from './util/NIOD';

export default async function processMetadata({oaiIdentifier, rootId, collectionId}: MetadataParams): Promise<void> {
    if (!config.metadataPath)
        throw new Error('Cannot process metadata, as there is no metadata path configured!');

    if (!rootId && !collectionId)
        throw new Error('Cannot process metadata, as there is no root id or collection id provided!');

    try {
        if (rootId)
            await updateWithRootId(rootId);
        else if (collectionId)
            await updateWithRootId(NIOD.getRootId(collectionId));
    }
    catch (e: any) {
        const err = new Error(`Failed to process the metadata for ${collectionId}: ${e.message}`);
        err.stack = e.stack;
        throw err;
    }
}

async function updateWithRootId(rootId: string): Promise<void> {
    const path = join(config.metadataPath as string, `${rootId}.txt`);
    if (!existsSync(path))
        throw new Error(`No metadata file found for ${rootId} in ${path}`);

    const collections = await getCollectionIdsIndexed(rootId);
    logger.debug(`Updating metadata for collections: ${collections.join(' ')}`);

    const allMetadata: MinimalItem[] = [];
    for (const id of collections) {
        const metadataItems = await updateForCollection(id, path);
        allMetadata.push(...metadataItems);
    }

    await updateItems(allMetadata);

    logger.debug(`Updated metadata for ${rootId}`);
}

export async function updateForCollection(collectionId: string, path: string): Promise<MinimalItem[]> {
    const rl = readline.createInterface({
        input: createReadStream(path),
        output: process.stdout,
        terminal: false
    });

    const accessDate = await NIOD.findAccessDate(collectionId, rl);

    return [{
        id: collectionId,
        collection_id: collectionId,
        label: collectionId,
        niod: {accessDate}
    }];
}
