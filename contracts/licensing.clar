;; Licensing Contract

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_LICENSED (err u409))

(define-data-var next-license-id uint u0)

(define-map licenses
  { license-id: uint }
  {
    licensor: principal,
    licensee: principal,
    terms: (string-utf8 1024),
    start-date: uint,
    end-date: uint,
    royalty-rate: uint,
    active: bool
  }
)

(define-public (create-license (licensee principal) (terms (string-utf8 1024)) (duration uint) (royalty-rate uint))
  (let
    (
      (license-id (var-get next-license-id))
      (start-date block-height)
      (end-date (+ block-height duration))
    )
    (var-set next-license-id (+ license-id u1))
    (ok (map-set licenses
      { license-id: license-id }
      {
        licensor: tx-sender,
        licensee: licensee,
        terms: terms,
        start-date: start-date,
        end-date: end-date,
        royalty-rate: royalty-rate,
        active: true
      }
    ))
  )
)

(define-public (terminate-license (license-id uint))
  (let
    ((license-data (unwrap! (map-get? licenses { license-id: license-id }) ERR_NOT_FOUND)))
    (asserts! (or (is-eq tx-sender (get licensor license-data)) (is-eq tx-sender (get licensee license-data))) ERR_NOT_AUTHORIZED)
    (ok (map-set licenses
      { license-id: license-id }
      (merge license-data { active: false })
    ))
  )
)

(define-read-only (get-license (license-id uint))
  (map-get? licenses { license-id: license-id })
)

(define-read-only (is-license-active (license-id uint))
  (default-to false (get active (map-get? licenses { license-id: license-id })))
)

