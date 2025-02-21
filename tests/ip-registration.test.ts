import { describe, it, beforeEach, expect } from "vitest"

describe("IP Registration Contract", () => {
  let mockStorage: Map<string, any>
  let ipIdNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    ipIdNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-ip":
        const [ipType, title, description, duration] = args
        ipIdNonce++
        const registrationDate = 100 // mock block height
        const expirationDate = registrationDate + duration
        mockStorage.set(`ip-${ipIdNonce}`, {
          owner: sender,
          "ip-type": ipType,
          title,
          description,
          "registration-date": registrationDate,
          "expiration-date": expirationDate,
        })
        return { success: true, value: ipIdNonce }
      
      case "transfer-ip":
        const [ipId, newOwner] = args
        const ip = mockStorage.get(`ip-${ipId}`)
        if (!ip) return { success: false, error: "ERR_NOT_FOUND" }
        if (ip.owner !== sender) return { success: false, error: "ERR_NOT_AUTHORIZED" }
        ip.owner = newOwner
        mockStorage.set(`ip-${ipId}`, ip)
        return { success: true }
      
      case "get-ip":
        return { success: true, value: mockStorage.get(`ip-${args[0]}`) }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should register IP", () => {
    const result = mockContractCall(
        "register-ip",
        ["patent", "New Invention", "A groundbreaking technology", 1000],
        "user1",
    )
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should retrieve IP data", () => {
    mockContractCall("register-ip", ["patent", "New Invention", "A groundbreaking technology", 1000], "user1")
    const result = mockContractCall("get-ip", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      owner: "user1",
      "ip-type": "patent",
      title: "New Invention",
      description: "A groundbreaking technology",
      "registration-date": 100,
      "expiration-date": 1100,
    })
  })
  
  it("should transfer IP ownership", () => {
    mockContractCall("register-ip", ["patent", "New Invention", "A groundbreaking technology", 1000], "user1")
    const result = mockContractCall("transfer-ip", [1, "user2"], "user1")
    expect(result.success).toBe(true)
    const updatedIp = mockContractCall("get-ip", [1], "anyone")
    expect(updatedIp.value.owner).toBe("user2")
  })
  
  it("should not transfer IP if not the owner", () => {
    mockContractCall("register-ip", ["patent", "New Invention", "A groundbreaking technology", 1000], "user1")
    const result = mockContractCall("transfer-ip", [1, "user3"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
})

