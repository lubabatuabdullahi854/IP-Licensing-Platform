import { describe, it, beforeEach, expect } from "vitest"

describe("Licensing Contract", () => {
  let mockStorage: Map<string, any>
  let licenseIdNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    licenseIdNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-license":
        const [licensee, terms, duration, royaltyRate] = args
        licenseIdNonce++
        const startDate = 100 // mock block height
        const endDate = startDate + duration
        mockStorage.set(`license-${licenseIdNonce}`, {
          licensor: sender,
          licensee,
          terms,
          "start-date": startDate,
          "end-date": endDate,
          "royalty-rate": royaltyRate,
          active: true,
        })
        return { success: true, value: licenseIdNonce }
      
      case "terminate-license":
        const [licenseId] = args
        const license = mockStorage.get(`license-${licenseId}`)
        if (!license) return { success: false, error: "ERR_NOT_FOUND" }
        if (license.licensor !== sender && license.licensee !== sender)
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        license.active = false
        mockStorage.set(`license-${licenseId}`, license)
        return { success: true }
      
      case "get-license":
        return { success: true, value: mockStorage.get(`license-${args[0]}`) }
      
      case "is-license-active":
        const licenseData = mockStorage.get(`license-${args[0]}`)
        return { success: true, value: licenseData ? licenseData.active : false }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should create a license", () => {
    const result = mockContractCall("create-license", ["user2", "License terms", 1000, 5], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should retrieve license data", () => {
    mockContractCall("create-license", ["user2", "License terms", 1000, 5], "user1")
    const result = mockContractCall("get-license", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      licensor: "user1",
      licensee: "user2",
      terms: "License terms",
      "start-date": 100,
      "end-date": 1100,
      "royalty-rate": 5,
      active: true,
    })
  })
  
  it("should terminate a license", () => {
    mockContractCall("create-license", ["user2", "License terms", 1000, 5], "user1")
    const result = mockContractCall("terminate-license", [1], "user1")
    expect(result.success).toBe(true)
    const isActive = mockContractCall("is-license-active", [1], "anyone")
    expect(isActive.value).toBe(false)
  })
  
  it("should not terminate a license if not authorized", () => {
    mockContractCall("create-license", ["user2", "License terms", 1000, 5], "user1")
    const result = mockContractCall("terminate-license", [1], "user3")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should check if a license is active", () => {
    mockContractCall("create-license", ["user2", "License terms", 1000, 5], "user1")
    const result = mockContractCall("is-license-active", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
})

