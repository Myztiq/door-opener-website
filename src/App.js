import React, { Component } from 'react';
import './App.css';
import DoorOpen from './images/DoorOpen.js'
import DoorClosed from './images/DoorClosed.js'
import Cogs from './images/Cogs.js'
import Truck from './images/Truck.js'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      accessToken: null,
      particleId: null,
      loading: true,
      error: null,
      saved: false,
      openDuration: 4,
      isOpenOnDeliveryActive: false,
      openOnNextBuzzActive: false,
      runningOpenDoor: false,
      runningOpenOnDelivery: false,
      runningOpenOnBuzz: false
    }
  }

  openDoor = () => {
    this.setState({runningOpenDoor: true})
    window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openDoor`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `access_token=${encodeURIComponent(this.state.accessToken)}&args=${this.state.openDuration * 1000}`
    })
      .then(() => {
        this.setState({runningOpenDoor: false})
      })
  }

  openOnNextBuzz = () => {
    this.setState({runningOpenOnBuzz: true})
    window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openOnBuzz`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `access_token=${encodeURIComponent(this.state.accessToken)}&args=${this.state.openDuration * 1000}`
    })
      .then(() => {
        this.pollForNextBuzzStatus()
          .then(() => {
            this.setState({runningOpenOnBuzz: false})
          })
      })
  }

  toggleOpenForDelivery = () => {
    this.setState({runningOpenOnDelivery: true})
    window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openOnDeliv`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `access_token=${encodeURIComponent(this.state.accessToken)}&args=${this.state.openDuration * 1000}`
    })
      .then(() => {
        this.pollForNextDeliveryStatus()
          .then(() => {
            this.setState({runningOpenOnDelivery: false})
          })
      })
  }

  updateNextBuzzStatus = () => {
    return window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openOnBuzz?access_token=${this.state.accessToken}`, {
      method: 'GET'
    })
      .then((res) => {
        return res.json()
      })
      .then((openOnBuzz) => {
        const isOpenOnBuzzActive = openOnBuzz.result
        if (isOpenOnBuzzActive !== this.state.openOnNextBuzzActive) {
          this.setState({
            openOnNextBuzzActive: isOpenOnBuzzActive
          })
        }
        return isOpenOnBuzzActive
      })
  }

  updateNextDeliveryStatus = () => {
    return window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openOnDeliv?access_token=${this.state.accessToken}`, {
      method: 'GET'
    })
      .then((res) => {
        return res.json()
      })
      .then((openOnDelivery) => {
        const isOpenOnDeliveryActive = openOnDelivery.result
        if (isOpenOnDeliveryActive !== this.state.isOpenOnDeliveryActive) {
          this.setState({
            isOpenOnDeliveryActive: isOpenOnDeliveryActive
          })
        }
        return isOpenOnDeliveryActive
      })
  }

  pollForNextBuzzStatus = () => {
    clearInterval(this.fetchStatusInterval)
    this.fetchStatusInterval = setInterval(this.updateNextBuzzStatus, 5000)
    return this.updateNextBuzzStatus()
  }

  pollForNextDeliveryStatus = () => {
    clearInterval(this.fetchDeliveryInterval)
    this.fetchDeliveryInterval = setInterval(this.updateNextDeliveryStatus, 5000)
    return this.updateNextDeliveryStatus()
  }

  componentDidMount () {
    const values = {
      accessToken: window.localStorage.getItem('door_accessToken'),
      particleId: window.localStorage.getItem('door_particleId'),
      saved: window.localStorage.getItem('door_saved'),
      openDuration: window.localStorage.getItem('door_openDuration')
    }
    this.setState({
      accessToken: values.accessToken,
      particleId: values.particleId,
      loading: false,
      saved: values.saved === 'true',
      openDuration: values.openDuration ? parseInt(values.openDuration, 10) : 4
    })
    if (this.state.accessToken && this.state.particleId) {
      this.updateNextBuzzStatus()
      clearInterval(this.longFetchStatusInterval)
      this.longFetchStatusInterval = setInterval(this.updateNextBuzzStatus, 30000)
      this.updateNextDeliveryStatus()
      clearInterval(this.longFetchDeliveryInterval)
      this.longFetchDeliveryInterval = setInterval(this.updateNextDeliveryStatus, 30000)
    }
  }

  saveForm = () => {
    if (this.state.accessToken && this.state.particleId) {
      window.localStorage.setItem('door_accessToken', this.state.accessToken)
      window.localStorage.setItem('door_particleId', this.state.particleId)
      window.localStorage.setItem('door_saved', 'true')
      window.localStorage.setItem('door_openDuration', this.state.openDuration + '')
      if (this.state.accessToken && this.state.particleId) {
        this.updateNextBuzzStatus()
        clearInterval(this.longFetchStatusInterval)
        this.longFetchStatusInterval = setInterval(this.updateNextBuzzStatus, 30000)
        this.updateNextDeliveryStatus()
        clearInterval(this.longFetchDeliveryInterval)
        this.longFetchDeliveryInterval = setInterval(this.updateNextDeliveryStatus, 30000)
      }
      this.setState({
        saved: true
      })
    }
  }

  resetError = () => {
    this.setState({
      error: null
    })
  }

  triggerEdit = () => {
    this.setState({
      saved: false
    })
  }

  renderLoading () {
    return <span>Loading...</span>
  }

  renderHasConfiguration () {
    const getButtonClass = (flag) => {
      let className = 'btn btn-primary btn-lg btn-block'
      if (this.state[flag]) {
        className += ' loading disabled'
      }
      return className
    }
    return <div className='app-container'>
      <div className='app-buttonSpacer'>
        <div
          className={getButtonClass('runningOpenDoor')}
          onClick={this.openDoor}
        >
          <DoorOpen />
          Open Now
        </div>
      </div>
      <div className='app-buttonSpacer'>
        <div
          className={getButtonClass('runningOpenOnBuzz')}
          onClick={this.openOnNextBuzz}
        >
          {this.state.openOnNextBuzzActive ? <DoorOpen /> : <DoorClosed />}
          {this.state.openOnNextBuzzActive ? 'Cancel Open On My Buzz' : 'Open On My Buzz'}
        </div>
      </div>
      <div className='app-buttonSpacer'>
        <div
          className={getButtonClass('runningOpenOnDelivery')}
          onClick={this.toggleOpenForDelivery}
        >

          {this.state.isOpenOnDeliveryActive ? <DoorOpen /> : <Truck />}
          {this.state.isOpenOnDeliveryActive ? 'Cancel Open On Delivery' : 'Open On Next Delivery'}
        </div>
      </div>
      <div className='app-buttonSpacer'>
        <div
          className='btn btn-primary btn-lg btn-block'
          onClick={this.triggerEdit}
        >
          <Cogs />
          Change Configuration
        </div>
      </div>
    </div>
  }

  renderHasNoConfiguration() {
    return <div>
      <div style={{fontSize: 30, color: '#70C1B3'}}>Configuration</div>
      <div className='app-welcomeText'>Access Token</div>
      <input
        className='form-input'
        onChange={(evt) => this.setState({accessToken: evt.currentTarget.value})}
        defaultValue={this.state.accessToken}
        placeholder='Access Token'
      />
      <div>Particle ID</div>
      <input
        className='form-input'
        onChange={(evt) => this.setState({particleId: evt.currentTarget.value})}
        defaultValue={this.state.particleId}
        placeholder='Particle ID'
      />
      <div className='app-welcomeText'>Open Duration</div>
      <select
        className='form-select'
        value={this.state.openDuration}
        onChange={(evt) => this.setState({openDuration: evt.currentTarget.value})}
      >
        <option value={1}>1 second</option>
        <option value={2}>2 seconds</option>
        <option value={3}>3 seconds</option>
        <option value={4}>4 seconds</option>
        <option value={5}>5 seconds</option>
        <option value={6}>6 seconds</option>
        <option value={7}>7 seconds</option>
        <option value={8}>8 seconds</option>
        <option value={9}>9 seconds</option>
        <option value={10}>10 seconds</option>
        <option value={15}>15 seconds</option>
        <option value={20}>20 seconds</option>
        <option value={30}>30 seconds</option>
      </select>
      <div style={{marginTop: 20}}>
        <input
          type='button'
          className='btn btn-primary btn-lg btn-block'
          color="#50514F"
          onClick={this.saveForm}
          value='Save Configuration'
        />
      </div>
    </div>
  }

  renderError () {
    return <span>
      <div>ERROR: {this.state.error.message}</div>
      <input
        type='button'
        onClick={this.resetError}
        title='Reset'
      />
    </span>
  }

  render() {
    let content
    let pageStyles = 'app-container'
    if (this.state.error) {
      content = this.renderError()
    } else if (this.state.loading) {
      content = this.renderLoading()
    } else if (this.state.saved) {
      content = this.renderHasConfiguration()
    } else {
      pageStyles = 'app-configureContainer'
      content = this.renderHasNoConfiguration()
    }

    return <div className={pageStyles}>
      {content}
    </div>
  }
}
