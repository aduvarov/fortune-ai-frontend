export interface EnergyBalanceResponse {
    balance: number
}

export interface EnergyPackage {
    id: string
    energyAmount: number
    title: string
}

export interface EnergyPackagesResponse {
    packages: EnergyPackage[]
}

export interface PurchaseEnergyDto {
    packageId: 'energy_100' | 'energy_250' | 'energy_700'
}
