//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    inputValue: '',          //输入的城市
    weather: [],             //天气数据
    forecashData: [],        //天气预报的数据
    cityName: '',            //城市的名称
    isData: false,           //是否请求到了数据
    screenHeight: 0,         //默认容器高度
    adcode: 0,               //城市的编码
    startColor: '#87CEEB',   //渐变开始的颜色
    endColor: '#4169E1',     //渐变结束的颜色
    isSearch: false,         //是否显示搜索区域
    positionTop: -100,       //搜索区域的定位
    isRefresh: false         //判断是否下拉刷新
  },
  //事件处理函数
  onLoad: function () {
    wx.showLoading({
      title: '请稍等'
    })
    var that = this
    /*动态渲染自适应高度*/
    wx.getSystemInfo({
      success: function(res){
        that.setData({
          screenHeight: res.windowHeight
        })
      }
    })
    /*获取城市坐标，再通过高德API的逆地理编码获取到该坐标的城市编码*/
    wx.getLocation({
      type: 'wgs84',
      success (res) {
        const location = (res.longitude + ',' + res.latitude)
        wx.request({
          url: 'https://restapi.amap.com/v3/geocode/regeo',
          data: {
            'key': '你的key',
            'location': location
          },
          success: function(res) {
             // console.log(res)
            that.setData({
              adcode: res.data.regeocode.addressComponent.adcode
            })
            that.requestWeather()
          },
          complete: function(){
            wx.hideLoading()
          }
        })
      },
      fail: function () {
        wx.showModal({
          content: '定位不到该地址，请手动输入',
          showCancel: false,
          confirmText: '知道了',
          success: function(){
            isSearch: true
          }
        })
      }
    })
  },
  /*下拉刷新*/
  onPullDownRefresh() {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.setData({
      isRefresh: true
    })
    this.requestWeather()
  },
  /*分享*/
  onShareAppMessage(Object) {
    return {
      title: '',
      path: '',
      imageUrl: ''
    }
  },
  /*查询*/
  clickSeach: function() {
    var that = this;
    var inputValue = that.data.inputValue;
    that.setData({
      isSearch: false
    })
    if(inputValue == '') {
      wx.showModal({
        content: '请输入查询地址',
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      wx.showLoading({
        title: '请稍等'
      })
      wx.request({
        /*高德api */
        /*获取输入城市的adcode值 */
        url: 'https://restapi.amap.com/v3/geocode/geo',
        data: {
          'address': inputValue,
          'output': 'json',
          'key':'你的key'
        },
        success: function(res){
          wx.hideLoading()
          if(res.data.count == 0) {
            wx.showModal({
              content: '请输入正确的地址',
              showCancel: false,
              confirmText: '知道了'
            })
            return false
          } else {
            that.setData({
              adcode: res.data.geocodes[0].adcode,
              positionTop: -100
            })
            that.requestWeather()       //请求数据
          }
        },
        fail () {
          wx.showToast({
            title: '找不到你的位置呢',
            icon: 'none'
          })
        },
        complete: function(){
          wx.hideLoading()
        }
      })
    }
  },
  //获取输入框的值
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  /*使用和风天气API请求天气数据*/
  requestWeather () {
    // console.log('1')
    var that = this
    wx.request({
      url: 'https://free-api.heweather.com/s6/weather',
      data: {
        'key': '你的key',
        'location': that.data.adcode           /*根据adcode值获取天气数据*/
      },
      success: function (res) {
        // console.log(res)
        if (res.data.HeWeather6[0].status != 'ok') {
          wx.showModal({
            content: '该城市/地区没有你所请求的数据',
            showCancel: false,
            confirmText: '知道了'
          })
          that.setData({
            positionTop: 0
          })
        } else {
          wx.setStorageSync('weather', res.data.HeWeather6[0])        //写入缓存
          var weather = wx.getStorageSync('weather')                  //读取缓存
          var cityName = weather.basic.admin_area + ' ' + weather.basic.parent_city       //拼接省份和城市名称
          //wx.setNavigationBarColor()  //动态设置头部背景色
          that.setData({
            isData: true,
            weather: weather.now,
            forecashData: weather.daily_forecast,
            cityName: cityName,
            inputValue: ''
          })

        }

        if(that.data.isRefresh) {
          if(res.data.HeWeather6[0].status == 'ok') {
            wx.showToast({
              title: '刷新成功',
              icon: 'none'
            })
          } else {
            wx.showToast({
              title: '刷新失败，请稍后尝试',
              icon: 'none'
            })
          }
        }
      },
      fail: function() {
        wx.showToast({
          title: '网络似乎不太好哦~',
          icon: 'none'
        })
      },
      complete: function() {
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
        that.setData({
          isRefresh: false
        })
      }
    })
  },
  /*点击切换*/
  showSearch () {
    var that = this
    // console.log('1')
    that.setData({
      isSearch: true,
      positionTop: 0
    })
  },
  /*隐藏搜索区域*/
  hideSearch () {
    var that = this
    that.setData({
      positionTop: -100,
      inputValue: ''
    })
  }

})
