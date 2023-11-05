import { configureHardware } from "@devicescript/servers"
import { pins, board } from "@dsboard/pico_w"
import { startAccelerometer } from "@devicescript/drivers"
import { DA213BDriver } from "@devicescript/drivers/src/da213b"
import { MPU9250Driver } from "./mpu9250driver"
/**
 * Support for KittenBot Grape:bit ESP32-C3
 *
 * @url https://www.kittenbot.cc/products/kittenbot-grapebit
 * @devsPart KittenBot Grape:bit ESP32-C3
 * @devsWhenUsed
 */
export class MPU9250 {
    constructor() {
      configureHardware({
        i2c: {
            pinSDA: pins.GP0,
            pinSCL: pins.GP1,
        }
      })
    }

    /**
     * Gets the pin mappings
     */
    pins() {
        return pins
    }

    /**
     * Starts the accelerometer
     * @returns accelerometer client
     */
    async startAccelerometer() {
        const driver = new MPU9250Driver()
        await driver.init();
        const acc = await startAccelerometer(driver, {})
        return acc
    }
}
