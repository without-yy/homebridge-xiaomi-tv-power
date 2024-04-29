# HomeBridge 小米电视关机插件

用于将小米电视关机接入到Homekit，方便用siri关机。
没有开机功能，适合使用电视盒子的用户，利用 CEC 开机就可以了。
原理是利用小米电视的 HTTP 接口，可本地先测试接口是否可以使用


> 关机接口：http://IP:6095/controller?action=keyevent&keycode=power

> 查询状态 http://IP:6095/request?action=isalive

## 如何使用
- ```npm install https://github.com/without-yy/homebridge-xiaomi-tv-power.git```
- 修改配置文件，accessories 添加一项
```
{
    "accessory": "XiaomiTvPower",
    "name": "电视机",
    "ip": "xxx.xxx.xxx.xxx"
}
```
- 重启 HomeBridge

## 缺陷
- 状态接口请求超时，默认为已关机，务必检查ip是否可以连通
- 点击开启后，会自动设置为关闭状态，因为不支持开机功能
- 有可能可以利用开关的自动化唤醒 Apple TV 达到开机的效果（）
