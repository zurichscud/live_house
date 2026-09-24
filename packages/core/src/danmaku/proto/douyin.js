/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const douyin = $root.douyin = (() => {

    /**
     * Namespace douyin.
     * @exports douyin
     * @namespace
     */
    const douyin = {};

    douyin.Response = (function() {

        /**
         * Properties of a Response.
         * @typedef {Object} douyin.Response.$Properties
         * @property {Array.<douyin.Message.$Properties>|null} [messagesList] Response messagesList
         * @property {string|null} [cursor] Response cursor
         * @property {number|Long|null} [fetchInterval] Response fetchInterval
         * @property {number|Long|null} [now] Response now
         * @property {string|null} [internalExt] Response internalExt
         * @property {number|null} [fetchType] Response fetchType
         * @property {Object.<string,string>|null} [routeParams] Response routeParams
         * @property {number|Long|null} [heartbeatDuration] Response heartbeatDuration
         * @property {boolean|null} [needAck] Response needAck
         * @property {string|null} [pushServer] Response pushServer
         * @property {string|null} [liveCursor] Response liveCursor
         * @property {boolean|null} [historyNoMore] Response historyNoMore
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Response.
         * @memberof douyin
         * @interface IResponse
         * @augments douyin.Response.$Properties
         * @deprecated Use douyin.Response.$Properties instead.
         */

        /**
         * Shape of a Response.
         * @typedef {douyin.Response.$Properties} douyin.Response.$Shape
         */

        /**
         * Constructs a new Response.
         * @memberof douyin
         * @classdesc Represents a Response.
         * @constructor
         * @param {douyin.Response.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const Response = function (properties) {
            this.messagesList = [];
            this.routeParams = {};
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Response messagesList.
         * @member {Array.<douyin.Message.$Properties>} messagesList
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.messagesList = $util.emptyArray;

        /**
         * Response cursor.
         * @member {string} cursor
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.cursor = "";

        /**
         * Response fetchInterval.
         * @member {number|Long} fetchInterval
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.fetchInterval = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Response now.
         * @member {number|Long} now
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.now = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Response internalExt.
         * @member {string} internalExt
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.internalExt = "";

        /**
         * Response fetchType.
         * @member {number} fetchType
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.fetchType = 0;

        /**
         * Response routeParams.
         * @member {Object.<string,string>} routeParams
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.routeParams = $util.emptyObject;

        /**
         * Response heartbeatDuration.
         * @member {number|Long} heartbeatDuration
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.heartbeatDuration = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Response needAck.
         * @member {boolean} needAck
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.needAck = false;

        /**
         * Response pushServer.
         * @member {string} pushServer
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.pushServer = "";

        /**
         * Response liveCursor.
         * @member {string} liveCursor
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.liveCursor = "";

        /**
         * Response historyNoMore.
         * @member {boolean} historyNoMore
         * @memberof douyin.Response
         * @instance
         */
        Response.prototype.historyNoMore = false;

        /**
         * Creates a new Response instance using the specified properties.
         * @function create
         * @memberof douyin.Response
         * @static
         * @param {douyin.Response.$Properties=} [properties] Properties to set
         * @returns {douyin.Response} Response instance
         * @type {{
         *   (properties: douyin.Response.$Shape): douyin.Response & douyin.Response.$Shape;
         *   (properties?: douyin.Response.$Properties): douyin.Response;
         * }}
         */
        Response.create = function(properties) {
            return new Response(properties);
        };

        /**
         * Encodes the specified Response message. Does not implicitly {@link douyin.Response.verify|verify} messages.
         * @function encode
         * @memberof douyin.Response
         * @static
         * @param {douyin.Response.$Properties} message Response message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Response.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.messagesList != null && message.messagesList.length)
                for (let i = 0; i < message.messagesList.length; ++i)
                    $root.douyin.Message.encode(message.messagesList[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.cursor != null && $Object.hasOwnProperty.call(message, "cursor") && message.cursor !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.cursor);
            if (message.fetchInterval != null && $Object.hasOwnProperty.call(message, "fetchInterval") && (typeof message.fetchInterval === "object" ? message.fetchInterval.low || message.fetchInterval.high : message.fetchInterval !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.fetchInterval);
            if (message.now != null && $Object.hasOwnProperty.call(message, "now") && (typeof message.now === "object" ? message.now.low || message.now.high : message.now !== 0))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.now);
            if (message.internalExt != null && $Object.hasOwnProperty.call(message, "internalExt") && message.internalExt !== "")
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.internalExt);
            if (message.fetchType != null && $Object.hasOwnProperty.call(message, "fetchType") && message.fetchType !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.fetchType);
            if (message.routeParams != null && $Object.hasOwnProperty.call(message, "routeParams"))
                for (let keys = $Object.keys(message.routeParams), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.routeParams[keys[i]]).ldelim();
            if (message.heartbeatDuration != null && $Object.hasOwnProperty.call(message, "heartbeatDuration") && (typeof message.heartbeatDuration === "object" ? message.heartbeatDuration.low || message.heartbeatDuration.high : message.heartbeatDuration !== 0))
                writer.uint32(/* id 8, wireType 0 =*/64).uint64(message.heartbeatDuration);
            if (message.needAck != null && $Object.hasOwnProperty.call(message, "needAck") && message.needAck !== false)
                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.needAck);
            if (message.pushServer != null && $Object.hasOwnProperty.call(message, "pushServer") && message.pushServer !== "")
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.pushServer);
            if (message.liveCursor != null && $Object.hasOwnProperty.call(message, "liveCursor") && message.liveCursor !== "")
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.liveCursor);
            if (message.historyNoMore != null && $Object.hasOwnProperty.call(message, "historyNoMore") && message.historyNoMore !== false)
                writer.uint32(/* id 12, wireType 0 =*/96).bool(message.historyNoMore);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.Response
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.Response & douyin.Response.$Shape} Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Response.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, key, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.Response();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if (!(message.messagesList && message.messagesList.length))
                            message.messagesList = [];
                        message.messagesList.push($root.douyin.Message.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.cursor = value;
                        else
                            delete message.cursor;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.fetchInterval = value;
                        else
                            delete message.fetchInterval;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.now = value;
                        else
                            delete message.now;
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.internalExt = value;
                        else
                            delete message.internalExt;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.fetchType = value;
                        else
                            delete message.fetchType;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if (message.routeParams === $util.emptyObject)
                            message.routeParams = {};
                        let end2 = reader.uint32() + reader.pos;
                        if (end2 > reader.len)
                            throw $RangeError("index out of range");
                        reader.len = end2;
                        key = "";
                        value = "";
                        while (reader.pos < end2) {
                            let tag2 = reader.tag();
                            wireType = tag2 & 7;
                            switch (tag2 >>>= 3) {
                            case 1:
                                if (wireType !== 2)
                                    break;
                                key = reader.stringVerify();
                                continue;
                            case 2:
                                if (wireType !== 2)
                                    break;
                                value = reader.stringVerify();
                                continue;
                            }
                            reader.skipType(wireType, _depth, tag2);
                        }
                        if (reader.pos !== end2)
                            throw $RangeError("index out of range");
                        reader.len = end;
                        if (key === "__proto__")
                            $util.makeProp(message.routeParams, key);
                        message.routeParams[key] = value;
                        continue;
                    }
                case 8: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.heartbeatDuration = value;
                        else
                            delete message.heartbeatDuration;
                        continue;
                    }
                case 9: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.needAck = value;
                        else
                            delete message.needAck;
                        continue;
                    }
                case 10: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.pushServer = value;
                        else
                            delete message.pushServer;
                        continue;
                    }
                case 11: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.liveCursor = value;
                        else
                            delete message.liveCursor;
                        continue;
                    }
                case 12: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.historyNoMore = value;
                        else
                            delete message.historyNoMore;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for Response
         * @function getTypeUrl
         * @memberof douyin.Response
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Response.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.Response";
        };

        return Response;
    })();

    douyin.Message = (function() {

        /**
         * Properties of a Message.
         * @typedef {Object} douyin.Message.$Properties
         * @property {string|null} [method] Message method
         * @property {Uint8Array|null} [payload] Message payload
         * @property {number|Long|null} [msgId] Message msgId
         * @property {number|null} [msgType] Message msgType
         * @property {number|Long|null} [offset] Message offset
         * @property {boolean|null} [needWrdsStore] Message needWrdsStore
         * @property {number|Long|null} [wrdsVersion] Message wrdsVersion
         * @property {string|null} [wrdsSubKey] Message wrdsSubKey
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Message.
         * @memberof douyin
         * @interface IMessage
         * @augments douyin.Message.$Properties
         * @deprecated Use douyin.Message.$Properties instead.
         */

        /**
         * Shape of a Message.
         * @typedef {douyin.Message.$Properties} douyin.Message.$Shape
         */

        /**
         * Constructs a new Message.
         * @memberof douyin
         * @classdesc Represents a Message.
         * @constructor
         * @param {douyin.Message.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const Message = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Message method.
         * @member {string} method
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.method = "";

        /**
         * Message payload.
         * @member {Uint8Array} payload
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.payload = $util.newBuffer([]);

        /**
         * Message msgId.
         * @member {number|Long} msgId
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.msgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Message msgType.
         * @member {number} msgType
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.msgType = 0;

        /**
         * Message offset.
         * @member {number|Long} offset
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.offset = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Message needWrdsStore.
         * @member {boolean} needWrdsStore
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.needWrdsStore = false;

        /**
         * Message wrdsVersion.
         * @member {number|Long} wrdsVersion
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.wrdsVersion = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Message wrdsSubKey.
         * @member {string} wrdsSubKey
         * @memberof douyin.Message
         * @instance
         */
        Message.prototype.wrdsSubKey = "";

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof douyin.Message
         * @static
         * @param {douyin.Message.$Properties=} [properties] Properties to set
         * @returns {douyin.Message} Message instance
         * @type {{
         *   (properties: douyin.Message.$Shape): douyin.Message & douyin.Message.$Shape;
         *   (properties?: douyin.Message.$Properties): douyin.Message;
         * }}
         */
        Message.create = function(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link douyin.Message.verify|verify} messages.
         * @function encode
         * @memberof douyin.Message
         * @static
         * @param {douyin.Message.$Properties} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.method != null && $Object.hasOwnProperty.call(message, "method") && message.method !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.method);
            if (message.payload != null && $Object.hasOwnProperty.call(message, "payload") && message.payload.length)
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.payload);
            if (message.msgId != null && $Object.hasOwnProperty.call(message, "msgId") && (typeof message.msgId === "object" ? message.msgId.low || message.msgId.high : message.msgId !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.msgId);
            if (message.msgType != null && $Object.hasOwnProperty.call(message, "msgType") && message.msgType !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.msgType);
            if (message.offset != null && $Object.hasOwnProperty.call(message, "offset") && (typeof message.offset === "object" ? message.offset.low || message.offset.high : message.offset !== 0))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.offset);
            if (message.needWrdsStore != null && $Object.hasOwnProperty.call(message, "needWrdsStore") && message.needWrdsStore !== false)
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.needWrdsStore);
            if (message.wrdsVersion != null && $Object.hasOwnProperty.call(message, "wrdsVersion") && (typeof message.wrdsVersion === "object" ? message.wrdsVersion.low || message.wrdsVersion.high : message.wrdsVersion !== 0))
                writer.uint32(/* id 7, wireType 0 =*/56).int64(message.wrdsVersion);
            if (message.wrdsSubKey != null && $Object.hasOwnProperty.call(message, "wrdsSubKey") && message.wrdsSubKey !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.wrdsSubKey);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.Message & douyin.Message.$Shape} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.Message();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.method = value;
                        else
                            delete message.method;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.payload = value;
                        else
                            delete message.payload;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.msgId = value;
                        else
                            delete message.msgId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.msgType = value;
                        else
                            delete message.msgType;
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.offset = value;
                        else
                            delete message.offset;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.needWrdsStore = value;
                        else
                            delete message.needWrdsStore;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.wrdsVersion = value;
                        else
                            delete message.wrdsVersion;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.wrdsSubKey = value;
                        else
                            delete message.wrdsSubKey;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for Message
         * @function getTypeUrl
         * @memberof douyin.Message
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Message.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.Message";
        };

        return Message;
    })();

    douyin.ChatMessage = (function() {

        /**
         * Properties of a ChatMessage.
         * @typedef {Object} douyin.ChatMessage.$Properties
         * @property {douyin.Common.$Properties|null} [common] ChatMessage common
         * @property {douyin.User.$Properties|null} [user] ChatMessage user
         * @property {string|null} [content] ChatMessage content
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a ChatMessage.
         * @memberof douyin
         * @interface IChatMessage
         * @augments douyin.ChatMessage.$Properties
         * @deprecated Use douyin.ChatMessage.$Properties instead.
         */

        /**
         * Shape of a ChatMessage.
         * @typedef {douyin.ChatMessage.$Properties} douyin.ChatMessage.$Shape
         */

        /**
         * Constructs a new ChatMessage.
         * @memberof douyin
         * @classdesc Represents a ChatMessage.
         * @constructor
         * @param {douyin.ChatMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const ChatMessage = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * ChatMessage common.
         * @member {douyin.Common.$Properties|null|undefined} common
         * @memberof douyin.ChatMessage
         * @instance
         */
        ChatMessage.prototype.common = null;

        /**
         * ChatMessage user.
         * @member {douyin.User.$Properties|null|undefined} user
         * @memberof douyin.ChatMessage
         * @instance
         */
        ChatMessage.prototype.user = null;

        /**
         * ChatMessage content.
         * @member {string} content
         * @memberof douyin.ChatMessage
         * @instance
         */
        ChatMessage.prototype.content = "";

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @function create
         * @memberof douyin.ChatMessage
         * @static
         * @param {douyin.ChatMessage.$Properties=} [properties] Properties to set
         * @returns {douyin.ChatMessage} ChatMessage instance
         * @type {{
         *   (properties: douyin.ChatMessage.$Shape): douyin.ChatMessage & douyin.ChatMessage.$Shape;
         *   (properties?: douyin.ChatMessage.$Properties): douyin.ChatMessage;
         * }}
         */
        ChatMessage.create = function(properties) {
            return new ChatMessage(properties);
        };

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link douyin.ChatMessage.verify|verify} messages.
         * @function encode
         * @memberof douyin.ChatMessage
         * @static
         * @param {douyin.ChatMessage.$Properties} message ChatMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.common != null && $Object.hasOwnProperty.call(message, "common"))
                $root.douyin.Common.encode(message.common, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.user != null && $Object.hasOwnProperty.call(message, "user"))
                $root.douyin.User.encode(message.user, writer.uint32(/* id 2, wireType 2 =*/18).fork(), _depth + 1).ldelim();
            if (message.content != null && $Object.hasOwnProperty.call(message, "content") && message.content !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.content);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.ChatMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.ChatMessage & douyin.ChatMessage.$Shape} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.ChatMessage();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.common = $root.douyin.Common.decode(reader, reader.uint32(), $undefined, _depth + 1, message.common);
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        message.user = $root.douyin.User.decode(reader, reader.uint32(), $undefined, _depth + 1, message.user);
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.content = value;
                        else
                            delete message.content;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for ChatMessage
         * @function getTypeUrl
         * @memberof douyin.ChatMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        ChatMessage.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.ChatMessage";
        };

        return ChatMessage;
    })();

    douyin.RoomUserSeqMessage = (function() {

        /**
         * Properties of a RoomUserSeqMessage.
         * @typedef {Object} douyin.RoomUserSeqMessage.$Properties
         * @property {douyin.Common.$Properties|null} [common] RoomUserSeqMessage common
         * @property {number|Long|null} [total] RoomUserSeqMessage total
         * @property {string|null} [popStr] RoomUserSeqMessage popStr
         * @property {number|Long|null} [popularity] RoomUserSeqMessage popularity
         * @property {number|Long|null} [totalUser] RoomUserSeqMessage totalUser
         * @property {string|null} [totalUserStr] RoomUserSeqMessage totalUserStr
         * @property {string|null} [totalStr] RoomUserSeqMessage totalStr
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a RoomUserSeqMessage.
         * @memberof douyin
         * @interface IRoomUserSeqMessage
         * @augments douyin.RoomUserSeqMessage.$Properties
         * @deprecated Use douyin.RoomUserSeqMessage.$Properties instead.
         */

        /**
         * Shape of a RoomUserSeqMessage.
         * @typedef {douyin.RoomUserSeqMessage.$Properties} douyin.RoomUserSeqMessage.$Shape
         */

        /**
         * Constructs a new RoomUserSeqMessage.
         * @memberof douyin
         * @classdesc Represents a RoomUserSeqMessage.
         * @constructor
         * @param {douyin.RoomUserSeqMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const RoomUserSeqMessage = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * RoomUserSeqMessage common.
         * @member {douyin.Common.$Properties|null|undefined} common
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.common = null;

        /**
         * RoomUserSeqMessage total.
         * @member {number|Long} total
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.total = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomUserSeqMessage popStr.
         * @member {string} popStr
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.popStr = "";

        /**
         * RoomUserSeqMessage popularity.
         * @member {number|Long} popularity
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.popularity = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomUserSeqMessage totalUser.
         * @member {number|Long} totalUser
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.totalUser = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomUserSeqMessage totalUserStr.
         * @member {string} totalUserStr
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.totalUserStr = "";

        /**
         * RoomUserSeqMessage totalStr.
         * @member {string} totalStr
         * @memberof douyin.RoomUserSeqMessage
         * @instance
         */
        RoomUserSeqMessage.prototype.totalStr = "";

        /**
         * Creates a new RoomUserSeqMessage instance using the specified properties.
         * @function create
         * @memberof douyin.RoomUserSeqMessage
         * @static
         * @param {douyin.RoomUserSeqMessage.$Properties=} [properties] Properties to set
         * @returns {douyin.RoomUserSeqMessage} RoomUserSeqMessage instance
         * @type {{
         *   (properties: douyin.RoomUserSeqMessage.$Shape): douyin.RoomUserSeqMessage & douyin.RoomUserSeqMessage.$Shape;
         *   (properties?: douyin.RoomUserSeqMessage.$Properties): douyin.RoomUserSeqMessage;
         * }}
         */
        RoomUserSeqMessage.create = function(properties) {
            return new RoomUserSeqMessage(properties);
        };

        /**
         * Encodes the specified RoomUserSeqMessage message. Does not implicitly {@link douyin.RoomUserSeqMessage.verify|verify} messages.
         * @function encode
         * @memberof douyin.RoomUserSeqMessage
         * @static
         * @param {douyin.RoomUserSeqMessage.$Properties} message RoomUserSeqMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoomUserSeqMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.common != null && $Object.hasOwnProperty.call(message, "common"))
                $root.douyin.Common.encode(message.common, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.total != null && $Object.hasOwnProperty.call(message, "total") && (typeof message.total === "object" ? message.total.low || message.total.high : message.total !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.total);
            if (message.popStr != null && $Object.hasOwnProperty.call(message, "popStr") && message.popStr !== "")
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.popStr);
            if (message.popularity != null && $Object.hasOwnProperty.call(message, "popularity") && (typeof message.popularity === "object" ? message.popularity.low || message.popularity.high : message.popularity !== 0))
                writer.uint32(/* id 6, wireType 0 =*/48).int64(message.popularity);
            if (message.totalUser != null && $Object.hasOwnProperty.call(message, "totalUser") && (typeof message.totalUser === "object" ? message.totalUser.low || message.totalUser.high : message.totalUser !== 0))
                writer.uint32(/* id 7, wireType 0 =*/56).int64(message.totalUser);
            if (message.totalUserStr != null && $Object.hasOwnProperty.call(message, "totalUserStr") && message.totalUserStr !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.totalUserStr);
            if (message.totalStr != null && $Object.hasOwnProperty.call(message, "totalStr") && message.totalStr !== "")
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.totalStr);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a RoomUserSeqMessage message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.RoomUserSeqMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.RoomUserSeqMessage & douyin.RoomUserSeqMessage.$Shape} RoomUserSeqMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoomUserSeqMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.RoomUserSeqMessage();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.common = $root.douyin.Common.decode(reader, reader.uint32(), $undefined, _depth + 1, message.common);
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.total = value;
                        else
                            delete message.total;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.popStr = value;
                        else
                            delete message.popStr;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.popularity = value;
                        else
                            delete message.popularity;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.totalUser = value;
                        else
                            delete message.totalUser;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.totalUserStr = value;
                        else
                            delete message.totalUserStr;
                        continue;
                    }
                case 9: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.totalStr = value;
                        else
                            delete message.totalStr;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for RoomUserSeqMessage
         * @function getTypeUrl
         * @memberof douyin.RoomUserSeqMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        RoomUserSeqMessage.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.RoomUserSeqMessage";
        };

        return RoomUserSeqMessage;
    })();

    douyin.User = (function() {

        /**
         * Properties of a User.
         * @typedef {Object} douyin.User.$Properties
         * @property {number|Long|null} [id] User id
         * @property {number|Long|null} [shortId] User shortId
         * @property {string|null} [nickName] User nickName
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a User.
         * @memberof douyin
         * @interface IUser
         * @augments douyin.User.$Properties
         * @deprecated Use douyin.User.$Properties instead.
         */

        /**
         * Shape of a User.
         * @typedef {douyin.User.$Properties} douyin.User.$Shape
         */

        /**
         * Constructs a new User.
         * @memberof douyin
         * @classdesc Represents a User.
         * @constructor
         * @param {douyin.User.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const User = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * User id.
         * @member {number|Long} id
         * @memberof douyin.User
         * @instance
         */
        User.prototype.id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * User shortId.
         * @member {number|Long} shortId
         * @memberof douyin.User
         * @instance
         */
        User.prototype.shortId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * User nickName.
         * @member {string} nickName
         * @memberof douyin.User
         * @instance
         */
        User.prototype.nickName = "";

        /**
         * Creates a new User instance using the specified properties.
         * @function create
         * @memberof douyin.User
         * @static
         * @param {douyin.User.$Properties=} [properties] Properties to set
         * @returns {douyin.User} User instance
         * @type {{
         *   (properties: douyin.User.$Shape): douyin.User & douyin.User.$Shape;
         *   (properties?: douyin.User.$Properties): douyin.User;
         * }}
         */
        User.create = function(properties) {
            return new User(properties);
        };

        /**
         * Encodes the specified User message. Does not implicitly {@link douyin.User.verify|verify} messages.
         * @function encode
         * @memberof douyin.User
         * @static
         * @param {douyin.User.$Properties} message User message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        User.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.id != null && $Object.hasOwnProperty.call(message, "id") && (typeof message.id === "object" ? message.id.low || message.id.high : message.id !== 0))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.id);
            if (message.shortId != null && $Object.hasOwnProperty.call(message, "shortId") && (typeof message.shortId === "object" ? message.shortId.low || message.shortId.high : message.shortId !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.shortId);
            if (message.nickName != null && $Object.hasOwnProperty.call(message, "nickName") && message.nickName !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.nickName);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a User message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.User
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.User & douyin.User.$Shape} User
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        User.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.User();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.id = value;
                        else
                            delete message.id;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.shortId = value;
                        else
                            delete message.shortId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.nickName = value;
                        else
                            delete message.nickName;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for User
         * @function getTypeUrl
         * @memberof douyin.User
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        User.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.User";
        };

        return User;
    })();

    douyin.Common = (function() {

        /**
         * Properties of a Common.
         * @typedef {Object} douyin.Common.$Properties
         * @property {string|null} [method] Common method
         * @property {number|Long|null} [msgId] Common msgId
         * @property {number|Long|null} [roomId] Common roomId
         * @property {number|Long|null} [createTime] Common createTime
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Common.
         * @memberof douyin
         * @interface ICommon
         * @augments douyin.Common.$Properties
         * @deprecated Use douyin.Common.$Properties instead.
         */

        /**
         * Shape of a Common.
         * @typedef {douyin.Common.$Properties} douyin.Common.$Shape
         */

        /**
         * Constructs a new Common.
         * @memberof douyin
         * @classdesc Represents a Common.
         * @constructor
         * @param {douyin.Common.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const Common = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Common method.
         * @member {string} method
         * @memberof douyin.Common
         * @instance
         */
        Common.prototype.method = "";

        /**
         * Common msgId.
         * @member {number|Long} msgId
         * @memberof douyin.Common
         * @instance
         */
        Common.prototype.msgId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Common roomId.
         * @member {number|Long} roomId
         * @memberof douyin.Common
         * @instance
         */
        Common.prototype.roomId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Common createTime.
         * @member {number|Long} createTime
         * @memberof douyin.Common
         * @instance
         */
        Common.prototype.createTime = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new Common instance using the specified properties.
         * @function create
         * @memberof douyin.Common
         * @static
         * @param {douyin.Common.$Properties=} [properties] Properties to set
         * @returns {douyin.Common} Common instance
         * @type {{
         *   (properties: douyin.Common.$Shape): douyin.Common & douyin.Common.$Shape;
         *   (properties?: douyin.Common.$Properties): douyin.Common;
         * }}
         */
        Common.create = function(properties) {
            return new Common(properties);
        };

        /**
         * Encodes the specified Common message. Does not implicitly {@link douyin.Common.verify|verify} messages.
         * @function encode
         * @memberof douyin.Common
         * @static
         * @param {douyin.Common.$Properties} message Common message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Common.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.method != null && $Object.hasOwnProperty.call(message, "method") && message.method !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.method);
            if (message.msgId != null && $Object.hasOwnProperty.call(message, "msgId") && (typeof message.msgId === "object" ? message.msgId.low || message.msgId.high : message.msgId !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.msgId);
            if (message.roomId != null && $Object.hasOwnProperty.call(message, "roomId") && (typeof message.roomId === "object" ? message.roomId.low || message.roomId.high : message.roomId !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.roomId);
            if (message.createTime != null && $Object.hasOwnProperty.call(message, "createTime") && (typeof message.createTime === "object" ? message.createTime.low || message.createTime.high : message.createTime !== 0))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.createTime);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a Common message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.Common
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.Common & douyin.Common.$Shape} Common
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Common.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.Common();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.method = value;
                        else
                            delete message.method;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.msgId = value;
                        else
                            delete message.msgId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.roomId = value;
                        else
                            delete message.roomId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.createTime = value;
                        else
                            delete message.createTime;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for Common
         * @function getTypeUrl
         * @memberof douyin.Common
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Common.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.Common";
        };

        return Common;
    })();

    douyin.PushFrame = (function() {

        /**
         * Properties of a PushFrame.
         * @typedef {Object} douyin.PushFrame.$Properties
         * @property {number|Long|null} [seqId] PushFrame seqId
         * @property {number|Long|null} [logId] PushFrame logId
         * @property {number|Long|null} [service] PushFrame service
         * @property {number|Long|null} [method] PushFrame method
         * @property {string|null} [payloadEncoding] PushFrame payloadEncoding
         * @property {string|null} [payloadType] PushFrame payloadType
         * @property {Uint8Array|null} [payload] PushFrame payload
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a PushFrame.
         * @memberof douyin
         * @interface IPushFrame
         * @augments douyin.PushFrame.$Properties
         * @deprecated Use douyin.PushFrame.$Properties instead.
         */

        /**
         * Shape of a PushFrame.
         * @typedef {douyin.PushFrame.$Properties} douyin.PushFrame.$Shape
         */

        /**
         * Constructs a new PushFrame.
         * @memberof douyin
         * @classdesc Represents a PushFrame.
         * @constructor
         * @param {douyin.PushFrame.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const PushFrame = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * PushFrame seqId.
         * @member {number|Long} seqId
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.seqId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PushFrame logId.
         * @member {number|Long} logId
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.logId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PushFrame service.
         * @member {number|Long} service
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.service = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PushFrame method.
         * @member {number|Long} method
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.method = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PushFrame payloadEncoding.
         * @member {string} payloadEncoding
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.payloadEncoding = "";

        /**
         * PushFrame payloadType.
         * @member {string} payloadType
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.payloadType = "";

        /**
         * PushFrame payload.
         * @member {Uint8Array} payload
         * @memberof douyin.PushFrame
         * @instance
         */
        PushFrame.prototype.payload = $util.newBuffer([]);

        /**
         * Creates a new PushFrame instance using the specified properties.
         * @function create
         * @memberof douyin.PushFrame
         * @static
         * @param {douyin.PushFrame.$Properties=} [properties] Properties to set
         * @returns {douyin.PushFrame} PushFrame instance
         * @type {{
         *   (properties: douyin.PushFrame.$Shape): douyin.PushFrame & douyin.PushFrame.$Shape;
         *   (properties?: douyin.PushFrame.$Properties): douyin.PushFrame;
         * }}
         */
        PushFrame.create = function(properties) {
            return new PushFrame(properties);
        };

        /**
         * Encodes the specified PushFrame message. Does not implicitly {@link douyin.PushFrame.verify|verify} messages.
         * @function encode
         * @memberof douyin.PushFrame
         * @static
         * @param {douyin.PushFrame.$Properties} message PushFrame message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PushFrame.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.seqId != null && $Object.hasOwnProperty.call(message, "seqId") && (typeof message.seqId === "object" ? message.seqId.low || message.seqId.high : message.seqId !== 0))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.seqId);
            if (message.logId != null && $Object.hasOwnProperty.call(message, "logId") && (typeof message.logId === "object" ? message.logId.low || message.logId.high : message.logId !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.logId);
            if (message.service != null && $Object.hasOwnProperty.call(message, "service") && (typeof message.service === "object" ? message.service.low || message.service.high : message.service !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.service);
            if (message.method != null && $Object.hasOwnProperty.call(message, "method") && (typeof message.method === "object" ? message.method.low || message.method.high : message.method !== 0))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.method);
            if (message.payloadEncoding != null && $Object.hasOwnProperty.call(message, "payloadEncoding") && message.payloadEncoding !== "")
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.payloadEncoding);
            if (message.payloadType != null && $Object.hasOwnProperty.call(message, "payloadType") && message.payloadType !== "")
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.payloadType);
            if (message.payload != null && $Object.hasOwnProperty.call(message, "payload") && message.payload.length)
                writer.uint32(/* id 8, wireType 2 =*/66).bytes(message.payload);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Decodes a PushFrame message from the specified reader or buffer.
         * @function decode
         * @memberof douyin.PushFrame
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {douyin.PushFrame & douyin.PushFrame.$Shape} PushFrame
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PushFrame.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.douyin.PushFrame();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.seqId = value;
                        else
                            delete message.seqId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.logId = value;
                        else
                            delete message.logId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.service = value;
                        else
                            delete message.service;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.method = value;
                        else
                            delete message.method;
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.payloadEncoding = value;
                        else
                            delete message.payloadEncoding;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.payloadType = value;
                        else
                            delete message.payloadType;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.payload = value;
                        else
                            delete message.payload;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Gets the type url for PushFrame
         * @function getTypeUrl
         * @memberof douyin.PushFrame
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        PushFrame.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/douyin.PushFrame";
        };

        return PushFrame;
    })();

    return douyin;
})();

export {
  $root as default
};
