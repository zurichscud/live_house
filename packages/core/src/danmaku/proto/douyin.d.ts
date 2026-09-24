import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace douyin. */
export namespace douyin {

    /**
     * Properties of a Response.
     * @deprecated Use douyin.Response.$Properties instead.
     */
    interface IResponse extends douyin.Response.$Properties {
    }

    /** Represents a Response. */
    class Response {

        /**
         * Constructs a new Response.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.Response.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Response messagesList. */
        messagesList: douyin.Message.$Properties[];

        /** Response cursor. */
        cursor: string;

        /** Response fetchInterval. */
        fetchInterval: (number|Long);

        /** Response now. */
        now: (number|Long);

        /** Response internalExt. */
        internalExt: string;

        /** Response fetchType. */
        fetchType: number;

        /** Response routeParams. */
        routeParams: { [k: string]: string };

        /** Response heartbeatDuration. */
        heartbeatDuration: (number|Long);

        /** Response needAck. */
        needAck: boolean;

        /** Response pushServer. */
        pushServer: string;

        /** Response liveCursor. */
        liveCursor: string;

        /** Response historyNoMore. */
        historyNoMore: boolean;

        /**
         * Creates a new Response instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Response instance
         */
        static create(properties: douyin.Response.$Shape): douyin.Response & douyin.Response.$Shape;
        static create(properties?: douyin.Response.$Properties): douyin.Response;

        /**
         * Encodes the specified Response message. Does not implicitly {@link douyin.Response.verify|verify} messages.
         * @param message Response message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.Response.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.Response & douyin.Response.$Shape} Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.Response & douyin.Response.$Shape;

        /**
         * Gets the type url for Response
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Response {

        /** Properties of a Response. */
        interface $Properties {

            /** Response messagesList */
            messagesList?: (douyin.Message.$Properties[]|null);

            /** Response cursor */
            cursor?: (string|null);

            /** Response fetchInterval */
            fetchInterval?: (number|Long|null);

            /** Response now */
            now?: (number|Long|null);

            /** Response internalExt */
            internalExt?: (string|null);

            /** Response fetchType */
            fetchType?: (number|null);

            /** Response routeParams */
            routeParams?: ({ [k: string]: string }|null);

            /** Response heartbeatDuration */
            heartbeatDuration?: (number|Long|null);

            /** Response needAck */
            needAck?: (boolean|null);

            /** Response pushServer */
            pushServer?: (string|null);

            /** Response liveCursor */
            liveCursor?: (string|null);

            /** Response historyNoMore */
            historyNoMore?: (boolean|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Response. */
        type $Shape = douyin.Response.$Properties;
    }

    /**
     * Properties of a Message.
     * @deprecated Use douyin.Message.$Properties instead.
     */
    interface IMessage extends douyin.Message.$Properties {
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.Message.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Message method. */
        method: string;

        /** Message payload. */
        payload: Uint8Array;

        /** Message msgId. */
        msgId: (number|Long);

        /** Message msgType. */
        msgType: number;

        /** Message offset. */
        offset: (number|Long);

        /** Message needWrdsStore. */
        needWrdsStore: boolean;

        /** Message wrdsVersion. */
        wrdsVersion: (number|Long);

        /** Message wrdsSubKey. */
        wrdsSubKey: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        static create(properties: douyin.Message.$Shape): douyin.Message & douyin.Message.$Shape;
        static create(properties?: douyin.Message.$Properties): douyin.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link douyin.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.Message.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.Message & douyin.Message.$Shape} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.Message & douyin.Message.$Shape;

        /**
         * Gets the type url for Message
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Message {

        /** Properties of a Message. */
        interface $Properties {

            /** Message method */
            method?: (string|null);

            /** Message payload */
            payload?: (Uint8Array|null);

            /** Message msgId */
            msgId?: (number|Long|null);

            /** Message msgType */
            msgType?: (number|null);

            /** Message offset */
            offset?: (number|Long|null);

            /** Message needWrdsStore */
            needWrdsStore?: (boolean|null);

            /** Message wrdsVersion */
            wrdsVersion?: (number|Long|null);

            /** Message wrdsSubKey */
            wrdsSubKey?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Message. */
        type $Shape = douyin.Message.$Properties;
    }

    /**
     * Properties of a ChatMessage.
     * @deprecated Use douyin.ChatMessage.$Properties instead.
     */
    interface IChatMessage extends douyin.ChatMessage.$Properties {
    }

    /** Represents a ChatMessage. */
    class ChatMessage {

        /**
         * Constructs a new ChatMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.ChatMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** ChatMessage common. */
        common?: (douyin.Common.$Properties|null);

        /** ChatMessage user. */
        user?: (douyin.User.$Properties|null);

        /** ChatMessage content. */
        content: string;

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatMessage instance
         */
        static create(properties: douyin.ChatMessage.$Shape): douyin.ChatMessage & douyin.ChatMessage.$Shape;
        static create(properties?: douyin.ChatMessage.$Properties): douyin.ChatMessage;

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link douyin.ChatMessage.verify|verify} messages.
         * @param message ChatMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.ChatMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.ChatMessage & douyin.ChatMessage.$Shape} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.ChatMessage & douyin.ChatMessage.$Shape;

        /**
         * Gets the type url for ChatMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace ChatMessage {

        /** Properties of a ChatMessage. */
        interface $Properties {

            /** ChatMessage common */
            common?: (douyin.Common.$Properties|null);

            /** ChatMessage user */
            user?: (douyin.User.$Properties|null);

            /** ChatMessage content */
            content?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a ChatMessage. */
        type $Shape = douyin.ChatMessage.$Properties;
    }

    /**
     * Properties of a RoomUserSeqMessage.
     * @deprecated Use douyin.RoomUserSeqMessage.$Properties instead.
     */
    interface IRoomUserSeqMessage extends douyin.RoomUserSeqMessage.$Properties {
    }

    /** Represents a RoomUserSeqMessage. */
    class RoomUserSeqMessage {

        /**
         * Constructs a new RoomUserSeqMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.RoomUserSeqMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** RoomUserSeqMessage common. */
        common?: (douyin.Common.$Properties|null);

        /** RoomUserSeqMessage total. */
        total: (number|Long);

        /** RoomUserSeqMessage popStr. */
        popStr: string;

        /** RoomUserSeqMessage popularity. */
        popularity: (number|Long);

        /** RoomUserSeqMessage totalUser. */
        totalUser: (number|Long);

        /** RoomUserSeqMessage totalUserStr. */
        totalUserStr: string;

        /** RoomUserSeqMessage totalStr. */
        totalStr: string;

        /**
         * Creates a new RoomUserSeqMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RoomUserSeqMessage instance
         */
        static create(properties: douyin.RoomUserSeqMessage.$Shape): douyin.RoomUserSeqMessage & douyin.RoomUserSeqMessage.$Shape;
        static create(properties?: douyin.RoomUserSeqMessage.$Properties): douyin.RoomUserSeqMessage;

        /**
         * Encodes the specified RoomUserSeqMessage message. Does not implicitly {@link douyin.RoomUserSeqMessage.verify|verify} messages.
         * @param message RoomUserSeqMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.RoomUserSeqMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RoomUserSeqMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.RoomUserSeqMessage & douyin.RoomUserSeqMessage.$Shape} RoomUserSeqMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.RoomUserSeqMessage & douyin.RoomUserSeqMessage.$Shape;

        /**
         * Gets the type url for RoomUserSeqMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace RoomUserSeqMessage {

        /** Properties of a RoomUserSeqMessage. */
        interface $Properties {

            /** RoomUserSeqMessage common */
            common?: (douyin.Common.$Properties|null);

            /** RoomUserSeqMessage total */
            total?: (number|Long|null);

            /** RoomUserSeqMessage popStr */
            popStr?: (string|null);

            /** RoomUserSeqMessage popularity */
            popularity?: (number|Long|null);

            /** RoomUserSeqMessage totalUser */
            totalUser?: (number|Long|null);

            /** RoomUserSeqMessage totalUserStr */
            totalUserStr?: (string|null);

            /** RoomUserSeqMessage totalStr */
            totalStr?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a RoomUserSeqMessage. */
        type $Shape = douyin.RoomUserSeqMessage.$Properties;
    }

    /**
     * Properties of a User.
     * @deprecated Use douyin.User.$Properties instead.
     */
    interface IUser extends douyin.User.$Properties {
    }

    /** Represents a User. */
    class User {

        /**
         * Constructs a new User.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.User.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** User id. */
        id: (number|Long);

        /** User shortId. */
        shortId: (number|Long);

        /** User nickName. */
        nickName: string;

        /**
         * Creates a new User instance using the specified properties.
         * @param [properties] Properties to set
         * @returns User instance
         */
        static create(properties: douyin.User.$Shape): douyin.User & douyin.User.$Shape;
        static create(properties?: douyin.User.$Properties): douyin.User;

        /**
         * Encodes the specified User message. Does not implicitly {@link douyin.User.verify|verify} messages.
         * @param message User message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.User.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a User message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.User & douyin.User.$Shape} User
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.User & douyin.User.$Shape;

        /**
         * Gets the type url for User
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace User {

        /** Properties of a User. */
        interface $Properties {

            /** User id */
            id?: (number|Long|null);

            /** User shortId */
            shortId?: (number|Long|null);

            /** User nickName */
            nickName?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a User. */
        type $Shape = douyin.User.$Properties;
    }

    /**
     * Properties of a Common.
     * @deprecated Use douyin.Common.$Properties instead.
     */
    interface ICommon extends douyin.Common.$Properties {
    }

    /** Represents a Common. */
    class Common {

        /**
         * Constructs a new Common.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.Common.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Common method. */
        method: string;

        /** Common msgId. */
        msgId: (number|Long);

        /** Common roomId. */
        roomId: (number|Long);

        /** Common createTime. */
        createTime: (number|Long);

        /**
         * Creates a new Common instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Common instance
         */
        static create(properties: douyin.Common.$Shape): douyin.Common & douyin.Common.$Shape;
        static create(properties?: douyin.Common.$Properties): douyin.Common;

        /**
         * Encodes the specified Common message. Does not implicitly {@link douyin.Common.verify|verify} messages.
         * @param message Common message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.Common.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Common message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.Common & douyin.Common.$Shape} Common
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.Common & douyin.Common.$Shape;

        /**
         * Gets the type url for Common
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Common {

        /** Properties of a Common. */
        interface $Properties {

            /** Common method */
            method?: (string|null);

            /** Common msgId */
            msgId?: (number|Long|null);

            /** Common roomId */
            roomId?: (number|Long|null);

            /** Common createTime */
            createTime?: (number|Long|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Common. */
        type $Shape = douyin.Common.$Properties;
    }

    /**
     * Properties of a PushFrame.
     * @deprecated Use douyin.PushFrame.$Properties instead.
     */
    interface IPushFrame extends douyin.PushFrame.$Properties {
    }

    /** Represents a PushFrame. */
    class PushFrame {

        /**
         * Constructs a new PushFrame.
         * @param [properties] Properties to set
         */
        constructor(properties?: douyin.PushFrame.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** PushFrame seqId. */
        seqId: (number|Long);

        /** PushFrame logId. */
        logId: (number|Long);

        /** PushFrame service. */
        service: (number|Long);

        /** PushFrame method. */
        method: (number|Long);

        /** PushFrame payloadEncoding. */
        payloadEncoding: string;

        /** PushFrame payloadType. */
        payloadType: string;

        /** PushFrame payload. */
        payload: Uint8Array;

        /**
         * Creates a new PushFrame instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PushFrame instance
         */
        static create(properties: douyin.PushFrame.$Shape): douyin.PushFrame & douyin.PushFrame.$Shape;
        static create(properties?: douyin.PushFrame.$Properties): douyin.PushFrame;

        /**
         * Encodes the specified PushFrame message. Does not implicitly {@link douyin.PushFrame.verify|verify} messages.
         * @param message PushFrame message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: douyin.PushFrame.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PushFrame message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {douyin.PushFrame & douyin.PushFrame.$Shape} PushFrame
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): douyin.PushFrame & douyin.PushFrame.$Shape;

        /**
         * Gets the type url for PushFrame
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace PushFrame {

        /** Properties of a PushFrame. */
        interface $Properties {

            /** PushFrame seqId */
            seqId?: (number|Long|null);

            /** PushFrame logId */
            logId?: (number|Long|null);

            /** PushFrame service */
            service?: (number|Long|null);

            /** PushFrame method */
            method?: (number|Long|null);

            /** PushFrame payloadEncoding */
            payloadEncoding?: (string|null);

            /** PushFrame payloadType */
            payloadType?: (string|null);

            /** PushFrame payload */
            payload?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a PushFrame. */
        type $Shape = douyin.PushFrame.$Properties;
    }
}
