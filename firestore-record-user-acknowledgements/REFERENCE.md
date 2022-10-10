# API Reference

Below contains an overview of the specifications for the Record User Acknowledgements extension, including TypeScript definitions & detailed descriptions.

## `NoticeDocument` Interface

The specification for a single document within the configured collection:

```ts
export interface NoticeDocument {
  // The document ID.
  id: string;
  // The type of notice, e.g. `banner` | `terms-and-condition` | `privacy-policy`.
  type: string;
  // An optional notice version. This can be used to filter a specific notice versions via the `getNotice` callable function.
  version?: number;
  // The optional title of the notice.
  title?: string;
  // The optional description of the notice.
  description?: string;
  // The optional link of the notice.
  link?: string;
  // The timestamp when the notice was created.
  createdAt: Timestamp;
  // A list of user IDs that are allowed to see the notice.
  allowList: string[];
}
```

## `AcknowledgementDocument` Interface

The specification for a single document within a notice sub-collection:

```ts
type BaseAcknowledgement = {
  // The document ID.
  id: string;
  // The UID of the user who acknowledged the notice.
  userId: string;
  // The ID of the notice that was acknowledged.
  noticeId: string;
  // The timestamp when the notice was acknowledged.
  createdAt: Timestamp;
  // The optional metadata of the acknowledgement.
  metadata: any;
};

export type AcknowledgementDocument =
  | (BaseAcknowledgement & {
      // The type of the acknowledgement.
      ackEvent: "acknowledged";
      // The type of the acknowledgement. Defaults to `seen`.
      type: string;
    })
  | (BaseAcknowledgement & {
      // The type of the acknowledgement.
      ackEvent: "unacknowledged";
    });
```

## `GetNoticeRequest` Interface

The response interface provided to a `getNotice` callable function:

```ts
export interface GetNoticeRequest {
  // The `type` of the notice to get.
  type: string;
  // If provided, the specific version of this notice (if exists) will be returned.
  version?: number;
}
```

## `GetNoticeResponse` Interface

The result interface returned from a `getNotice` callable function:

```ts
export type GetNoticeResponse = Omit<NoticeDocument, ‘allowList’> & {
 // The timestamp when the notice was unacknowledged by the user (undefined if the user has not unacknowledged this notice).
 unacknowledgedAt?: Timestamp;

 // An ordered array of user acknowledgements.
 acknowledgements: AcknowledgementDocument[];
}
```

## `AcknowledgeNoticeRequest` Interface

The response interface provided to a `acknowledgeNotice` callable function:

```ts
export interface AcknowledgeNoticeRequest {
  // The notice ID to acknowledge.
  noticeId: string;
  // A custom type to provide as the acknowledgement. Defaults to `seen`.
  type?: string;
  // Optional preference metadata to store with this acknowledgement.
  metadata?: any;
}
```

## `UnacknowledgeNoticeRequest` Interface

The response interface provided to a `unacknowledgeNotice` callable function:

```ts
export interface UnacknowledgeNoticeRequest {
  // The notice ID to unacknowledge.
  noticeId: string;
  // Optional preference metadata to store with this unacknowledgement.
  metadata?: any;
}
```

## `GetAcknowledgementsRequest` Interface

The response interface provided to a `getAcknowledgements` callable function:

```ts
export interface GetAcknowledgementsRequest {
  // If true, include unacknowledgement documents.
  includeUnacknowledgements?: boolean;
}
```

## `GetAcknowledgementsResponse` Interface

The response interface provided to a `getAcknowledgements` callable function:

```ts
export type GetAcknowledgementsResponse  = (AcknowledgementDocument & {
  // The notice of this acknowledgement, excluding the allowList.
  notice: Omit<NoticeDocument, ‘allowList’>;
})[];
```
