import { describe, it, beforeEach, expect } from "vitest"

describe("Royalty Distribution Contract", () => {
  let mockStorage: Map<string, any>
  let paymentIdNonce: number
  let tokenBalances: Map<string, number>
  
  beforeEach(() => {
    mockStorage = new Map()
    paymentIdNonce = 0
    tokenBalances = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "distribute-royalty":
        const [licensor, amount] = args
        paymentIdNonce++
        mockStorage.set(`payment-${paymentIdNonce}`, {
          licensor,
          licensee: sender,
          amount,
          "paid-at": Date.now(),
        })
        
        tokenBalances.set(sender, (tokenBalances.get(sender) || 0) - amount)
        tokenBalances.set(licensor, (tokenBalances.get(licensor) || 0) + amount)
        
        return { success: true, value: paymentIdNonce }
      
      case "get-royalty-payment":
        return { success: true, value: mockStorage.get(`payment-${args[0]}`) }
      
      case "get-royalty-balance":
        return { success: true, value: tokenBalances.get(args[0]) || 0 }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should distribute royalty", () => {
    tokenBalances.set("user2", 1000)
    const result = mockContractCall("distribute-royalty", ["user1", 100], "user2")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should retrieve royalty payment data", () => {
    tokenBalances.set("user2", 1000)
    mockContractCall("distribute-royalty", ["user1", 100], "user2")
    const result = mockContractCall("get-royalty-payment", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toMatchObject({
      licensor: "user1",
      licensee: "user2",
      amount: 100,
    })
  })
  
  it("should get royalty balance", () => {
    tokenBalances.set("user2", 1000)
    mockContractCall("distribute-royalty", ["user1", 100], "user2")
    const result = mockContractCall("get-royalty-balance", ["user1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(100)
  })
  
  it("should update balances correctly after multiple distributions", () => {
    tokenBalances.set("user2", 1000)
    mockContractCall("distribute-royalty", ["user1", 100], "user2")
    mockContractCall("distribute-royalty", ["user1", 150], "user2")
    const licensorBalance = mockContractCall("get-royalty-balance", ["user1"], "anyone")
    const licenseeBalance = mockContractCall("get-royalty-balance", ["user2"], "anyone")
    expect(licensorBalance.value).toBe(250)
    expect(licenseeBalance.value).toBe(750)
  })
})

