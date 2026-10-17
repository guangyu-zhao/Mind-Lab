/**
 * @typedef {Object} ScoreMeta
 * @property {number} schema
 * @property {string} rulesVersion
 * @property {Record<string,string|number|boolean>} rules
 * @property {{width:number,height:number,viewportWidth:number,viewportHeight:number,dpr:number,scale:number}} display
 * @property {string[]} inputTypes
 *
 * @typedef {Object} ScoreRecord
 * @property {string} id Stable client ID used for idempotent uploads.
 * @property {string} endedAt ISO timestamp.
 * @property {ScoreMeta} meta
 * @property {number} [score]
 * @property {string} [status]
 * @property {unknown[]} [trials]
 *
 * @typedef {Object} ScoreService
 * @property {string|null} userId
 * @property {(record:ScoreRecord, owner:string)=>void} submit
 * @property {(meta:ScoreMeta)=>void} setContext
 */
export {};
