;; Royalty Distribution Contract

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

(define-fungible-token royalty-token)

(define-map royalty-payments
  { payment-id: uint }
  {
    licensor: principal,
    licensee: principal,
    amount: uint,
    paid-at: uint
  }
)

(define-data-var next-payment-id uint u0)

(define-public (distribute-royalty (licensor principal) (amount uint))
  (let
    (
      (payment-id (var-get next-payment-id))
    )
    (try! (ft-mint? royalty-token amount tx-sender))
    (try! (ft-transfer? royalty-token amount tx-sender licensor))
    (var-set next-payment-id (+ payment-id u1))
    (ok (map-set royalty-payments
      { payment-id: payment-id }
      {
        licensor: licensor,
        licensee: tx-sender,
        amount: amount,
        paid-at: block-height
      }
    ))
  )
)

(define-read-only (get-royalty-payment (payment-id uint))
  (map-get? royalty-payments { payment-id: payment-id })
)

(define-read-only (get-royalty-balance (account principal))
  (ok (ft-get-balance royalty-token account))
)

