import { Accelerometer } from "@devicescript/core";
import { MPU9250, startMPU9250 } from "./mpu9250";

const accelerometer = new MPU9250();
const instance = await startMPU9250()

instance.reading.subscribe(v => {
    console.log("from accelerometer client", v)
})