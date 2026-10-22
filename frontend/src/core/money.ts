/** Integer minor units, used for fees and package prices only. */
export type Money = Readonly<{ minor: number; currency: string }>

export const money = (minor: number, currency: string): Money => ({ minor: Math.round(minor), currency })
