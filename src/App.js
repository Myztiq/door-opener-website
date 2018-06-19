import React, { Component } from 'react';
import './App.css';

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      accessToken: null,
      particleId: null,
      loading: true,
      error: null,
      saved: false,
      openDuration: 4
    }
  }

  openDoor = () => {
    window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openDoor`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `access_token=${encodeURIComponent(this.state.accessToken)}&args=${this.state.openDuration * 1000}`
    })
  }

  openOnNextBuzz = () => {
    window.fetch(`https://api.particle.io/v1/devices/${this.state.particleId}/openOnBuzz`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `access_token=${encodeURIComponent(this.state.accessToken)}&args=${this.state.openDuration * 1000}`
    })
      .then(() => {
        this.pollForNextBuzzStatus()
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

  pollForNextBuzzStatus = () => {
    this.updateNextBuzzStatus()
    clearInterval(this.fetchStatusInterval)
    this.fetchStatusInterval = setInterval(this.updateNextBuzzStatus, 5000)
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
    return <div className='app-container'>
      <div className='app-buttonSpacer'>
        <input
          className='btn btn-primary btn-lg btn-block'
          onClick={this.openDoor}
          value='Open Now'
          type='button'
        />
      </div>
      <div className='app-buttonSpacer'>
        <input
          className='btn btn-primary btn-lg btn-block'
          onClick={this.openOnNextBuzz}
          value={this.state.openOnNextBuzzActive ? 'Cancel Open On Buzz' : 'Open On Next Buzz'}
          type='button'
        />
      </div>
      <div className='app-buttonSpacer'>
        <input
          className='btn btn-primary btn-lg btn-block'
          onClick={this.triggerEdit}
          value='Change Configuration'
          type='button'
        />
      </div>
    </div>
  }

  renderHasNoConfiguration() {
    return <div>
      <div style={{fontSize: 30, color: '#70C1B3'}}>Welcome!</div>
      <div className='app-welcomeText'>I need some info to be able to open your door:</div>
      <div className='app-welcomeText'>Access Token</div>
      <input
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        onChange={(evt) => this.setState({accessToken: evt.currentTarget.value})}
        defaultValue={this.state.accessToken}
        placeholder='Access Token'
      />
      <div>Particle ID</div>
      <input
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        onChange={(evt) => this.setState({particleId: evt.currentTarget.value})}
        defaultValue={this.state.particleId}
        placeholder='Particle ID'
      />
      <div className='app-welcomeText'>Open Duration</div>
      <select
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
          name='check'
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
