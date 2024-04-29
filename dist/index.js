"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
// @ts-ignore
const package_json_1 = __importDefault(require("../package.json"));
let hap;
class XiaomiTvPowerOutlet {
    constructor(log, config) {
        this.outletState = false; // 插座开关状态，默认为关闭
        this.log = log;
        this.name = config.name || 'MiTV'; // 从配置中获取插件的名称，默认为'MiTV'
        this.config = config;
        this.ip = config.ip; // 从配置中获取ip
        this.log(`获取到${this.name}配置ip，${this.ip}`);
        this.service = new hap.Service.Outlet(this.name); // 创建一个Outlet服务
        // 设置开关状态变化时的回调函数
        this.service.getCharacteristic(hap.Characteristic.On)
            // @ts-ignore
            .on("set" /* CharacteristicEventTypes.SET */, this.setOutletState.bind(this))
            .on("get" /* CharacteristicEventTypes.GET */, this.getOutletState.bind(this)); // 添加获取开关状态的回调函数
        // 添加信息服务
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, 'Manufacturer')
            .setCharacteristic(hap.Characteristic.Model, 'TV')
            .setCharacteristic(hap.Characteristic.SerialNumber, '123-456-789')
            .setCharacteristic(hap.Characteristic.FirmwareRevision, package_json_1.default.version);
        // 30秒获取一次状态，缓存在本地，用于查询时快速返回
        this.updateCacheState();
        setInterval(() => this.updateCacheState(), 30 * 1000);
    }
    getServices() {
        return [this.informationService, this.service];
    }
    // 设置开关状态
    async setOutletState(value, callback) {
        this.log(`操作${this.config.name}: ${value}`);
        try {
            if (value) {
                callback();
                // 不支持远程开启，将状态重置
                this.setState(false);
            }
            else {
                // 关闭插座
                await axios_1.default.get(`http://${this.ip}:6095/controller?action=keyevent&keycode=power`, { timeout: 3000 });
                this.log(`${this.name}已关闭。`);
                this.outletState = false;
                callback();
            }
        }
        catch (error) {
            this.log(`无法关闭插座：${error.message}`);
            callback();
            this.setState(false);
        }
    }
    // 获取开关状态
    getOutletState(callback) {
        callback(null, this.outletState);
        this.getState().then(state => {
            this.setState(state);
        });
    }
    async getState(timeout = 3000) {
        try {
            await axios_1.default.get(`http://${this.ip}:6095/request?action=isalive`, { timeout });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    setState(currentState) {
        this.outletState = currentState;
        this.service.getCharacteristic(hap.Characteristic.On).updateValue(currentState);
    }
    updateCacheState() {
        this.getState().then(state => {
            this.setState(state);
        });
    }
}
module.exports = (api) => {
    hap = api.hap;
    api.registerAccessory('XiaomiTvPower', XiaomiTvPowerOutlet);
};
//# sourceMappingURL=index.js.map