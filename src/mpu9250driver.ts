import { Date } from "@devicescript/core/src/date"
import { AccelerometerDriver, Vector3D, I2CDriver } from "@devicescript/drivers"
import { i2c } from "@devicescript/i2c"

const MPU9250_DEFAULT_ADDRESS         = 0x68
const MPU9250_GYRO_FULL_SCALE_250DPS  = 0
const MPU9250_FULL_SCALE_8G           = 2
const MPU9250_PWR_MGMT_1              = 0x6B
const MPU9250_CLKSEL_MASK             = 0x07
const MPU9250_GYRO_CONFIG             = 0x1B
const MPU9250_GYRO_FS_SEL_MASK        = 0x18
const MPU9250_ACCEL_CONFIG            = 0x1C
const MPU9250_ACCEL_FS_SEL_MASK       = 0x18
const MPU9250_SLEEP_MASK              = 0x40

const MPU9250_ACCEL_XOUT_H            = 0x3B
const MPU9250_ACCEL_XOUT_L            = 0x3C
const MPU9250_ACCEL_YOUT_H            = 0x3D
const MPU9250_ACCEL_YOUT_L            = 0x3E
const MPU9250_ACCEL_ZOUT_H            = 0x3F
const MPU9250_ACCEL_ZOUT_L            = 0x40

const scale = 65550;
// convert signed 12-bit quantity from two I2C bytes into floating point
function convert(high: number, low: number) {
    const raw = ((high << 24) | (low << 16)) >> 20
    return (raw / (1 << 11)) * scale
}

export class MPU9250Driver extends I2CDriver implements AccelerometerDriver {
    constructor(addr: number = MPU9250_DEFAULT_ADDRESS) {
        super(addr)
    }

    override async initDriver(): Promise<void> {
        // Initialize the MPU9250
        await this.setClockSource(1); // Set clock source (0 for example)
        await this.setFullScaleGyroRange(MPU9250_GYRO_FULL_SCALE_250DPS); // Set gyro full-scale range (e.g., 250 DPS)
        await this.setFullScaleAccelRange(MPU9250_FULL_SCALE_8G); // Set accelerometer full-scale range (e.g., ±8g)
        await this.setSleepEnabled(false); // Disable sleep mode
    }

    async setClockSource(source: number): Promise<void> {
        if (source > 7) {
            // Handle invalid source value (optional)
            throw new Error("Invalid clock source value");
        }
    
        // Write the clock source value to the appropriate register
        const registerValue = await this.readReg(MPU9250_PWR_MGMT_1);
        const maskedValue = source & MPU9250_CLKSEL_MASK;
        const newRegisterValue = (registerValue & ~MPU9250_CLKSEL_MASK) | maskedValue;
        await this.writeReg(MPU9250_PWR_MGMT_1, newRegisterValue);
    }

    async setFullScaleGyroRange(range: number): Promise<void> {
        // Check if the range is within valid bounds (e.g., 0-3)
        if (range < 0 || range > 3) {
            // Handle an invalid range (optional)
            throw new Error("Invalid gyro range value");
        }
    
        // Write the gyro full-scale range value to the appropriate register
        const registerValue = await this.readReg(MPU9250_GYRO_CONFIG);
        const maskedValue = range << 3; // Shift range to the correct position
        const newRegisterValue = (registerValue & ~MPU9250_GYRO_FS_SEL_MASK) | maskedValue;
        await this.writeReg(MPU9250_GYRO_CONFIG, newRegisterValue);
    }

    async setFullScaleAccelRange(range: number): Promise<void> {
        // Check if the range is within valid bounds (e.g., 3 or greater)
        if (range < 3) {
            return
        }
    
        // Write the accelerometer full-scale range value to the appropriate register
        const registerValue = await this.readReg(MPU9250_ACCEL_CONFIG);
        const maskedValue = range << 3; // Shift range to the correct position
        const newRegisterValue = (registerValue & ~MPU9250_ACCEL_FS_SEL_MASK) | maskedValue;
        await this.writeReg(MPU9250_ACCEL_CONFIG, newRegisterValue);
    }
    
    async setSleepEnabled(enabled: boolean): Promise<void> {
        // Set X-axis accelerometer standby enabled status
        const registerValue = await this.readReg(MPU9250_PWR_MGMT_1);
        const maskedValue = enabled ? MPU9250_SLEEP_MASK : 0;
        const newRegisterValue = (registerValue & ~MPU9250_SLEEP_MASK) | maskedValue;
        await this.writeReg(MPU9250_PWR_MGMT_1, newRegisterValue);
    }
    
    supportedRanges(): number[] {
        return undefined
    }
    readingRange(): number {
        return undefined
    }
    async setReadingRange(value: number) {
        await this.writeReg(0x0f, value)
    }

    async readSample() {
        const data: Buffer = await this.readRegBuf(0x3B, 6)
        const x = convert(data[0], data[1])
        const y = convert(data[2], data[3])
        const z = convert(data[4], data[5])
        return [x,y,z]
    }

    subscribe(cb: (sample: Vector3D) => Promise<void>): void {
        const _this = this
        setInterval(async () => {
            const s = await _this.readSample()
            await cb(s as Vector3D)
        }, 50)
    }
}
