import { Accelerometer } from "@devicescript/core";
import { MPU9250 } from "./mpu9250";

const accelerometer = new MPU9250();
const instance = await accelerometer.startAccelerometer()

instance.reading.subscribe(v => {
    console.log("from accelerometer client", v)
})