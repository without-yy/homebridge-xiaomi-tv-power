import {
  API,
  Logging,
  HAP,
  AccessoryConfig,
  AccessoryPlugin,
  CharacteristicEventTypes,
  Service,
} from 'homebridge';
import axios from 'axios';

// @ts-ignore
import packageJSON from '../package.json';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('XiaomiTvPower', XiaomiTvPowerOutlet);
};

class XiaomiTvPowerOutlet implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly name: string;
  private readonly config: AccessoryConfig;
  private readonly ip: string;
  private readonly service: Service;
  private readonly informationService: Service;
  private outletState = false; // 插座开关状态，默认为关闭

  constructor(log: Logging, config: AccessoryConfig) {
    this.log = log;
    this.name = config.name || 'MiTV'; // 从配置中获取插件的名称，默认为'MiTV'
    this.config = config;
    this.ip = config.ip; // 从配置中获取ip

    this.log(`获取到${this.name}配置ip，${this.ip}`);

    this.service = new hap.Service.Outlet(this.name); // 创建一个Outlet服务
    // 设置开关状态变化时的回调函数
    this.service.getCharacteristic(hap.Characteristic.On)
      // @ts-ignore
      .on(CharacteristicEventTypes.SET, this.setOutletState.bind(this))
      .on(CharacteristicEventTypes.GET, this.getOutletState.bind(this)); // 添加获取开关状态的回调函数


    // 添加信息服务
    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Manufacturer')
      .setCharacteristic(hap.Characteristic.Model, 'TV')
      .setCharacteristic(hap.Characteristic.SerialNumber, '123-456-789')
      .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version);


    // 5分钟获取一次状态，缓存在本地，用于查询时快速返回
    this.updateCacheState();
    setInterval(() => this.updateCacheState(), 5 * 60 * 1000);
  }

  getServices(): Service[] {
    return [this.informationService, this.service];
  }

  // 设置开关状态
  async setOutletState(value: boolean, callback: (error?: Error | null) => void) {
    this.log(`操作${this.config.name}: ${value}`);
    try {
      if (value) {
        callback();
        // 不支持远程开启，将状态重置
        setTimeout(()=>{
          this.setState(false);
        }, 300);
      } else {
        // 关闭插座
        await axios.get(`http://${this.ip}:6095/controller?action=keyevent&keycode=power`, { timeout: 3000 });
        this.log(`${this.name}已关闭。`);
        this.outletState = true;
        callback();
      }
    } catch (error: any) {
      this.log(`无法关闭插座：${error.message}`);
      callback();
      setTimeout(()=>{
        this.setState(false);
      }, 300);
    }
  }

  // 获取开关状态
  getOutletState(callback: (error?: Error | null, value?: boolean) => void) {
    callback(null, this.outletState);
    this.getState().then(state=>{
      this.setState(state)
    });
  }

  async getState(timeout = 3000) {
    try {
      await axios.get(`http://${this.ip}:6095/request?action=isalive`, {timeout});
      return true;
    }catch (error) {
      return false;
    }
  }

  setState(currentState: boolean) {
    this.outletState = currentState;
    this.service.getCharacteristic(hap.Characteristic.On).updateValue(currentState);
  }

  updateCacheState() {
    this.getState().then(state=>{
      this.setState(state)
    });
  }
}
