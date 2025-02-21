;; IP Registration Contract

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_ALREADY_REGISTERED (err u409))
(define-constant ERR_NOT_FOUND (err u404))

(define-data-var next-ip-id uint u0)

(define-map ip-registry
  { ip-id: uint }
  {
    owner: principal,
    ip-type: (string-ascii 20),
    title: (string-utf8 256),
    description: (string-utf8 1024),
    registration-date: uint,
    expiration-date: uint
  }
)

(define-public (register-ip (ip-type (string-ascii 20)) (title (string-utf8 256)) (description (string-utf8 1024)) (duration uint))
  (let
    (
      (ip-id (var-get next-ip-id))
      (registration-date block-height)
      (expiration-date (+ block-height duration))
    )
    (asserts! (is-none (map-get? ip-registry { ip-id: ip-id })) ERR_ALREADY_REGISTERED)
    (var-set next-ip-id (+ ip-id u1))
    (ok (map-set ip-registry
      { ip-id: ip-id }
      {
        owner: tx-sender,
        ip-type: ip-type,
        title: title,
        description: description,
        registration-date: registration-date,
        expiration-date: expiration-date
      }
    ))
  )
)

(define-public (transfer-ip (ip-id uint) (new-owner principal))
  (let
    ((ip-data (unwrap! (map-get? ip-registry { ip-id: ip-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner ip-data)) ERR_NOT_AUTHORIZED)
    (ok (map-set ip-registry
      { ip-id: ip-id }
      (merge ip-data { owner: new-owner })
    ))
  )
)

(define-read-only (get-ip (ip-id uint))
  (map-get? ip-registry { ip-id: ip-id })
)

