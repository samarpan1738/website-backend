const chai = require('chai')
const { expect } = chai
const chaiHttp = require('chai-http')

const app = require('../../server')
const authService = require('../../services/authService')

const addUser = require('../utils/addUser')
const cleanDb = require('../utils/cleanDb')
const usersUtils = require('../../utils/users')

const userData = require('../fixtures/user/user')()
const { walletBodyKeys, walletKeys, walletDataKeys } = require('../fixtures/wallet/wallet')

const defaultUser = userData[0]
const newUser = userData[3]
const superUser = userData[4]

const config = require('config')
const cookieName = config.get('userToken.cookieName')

chai.use(chaiHttp)

describe('Wallet', function () {
  let authToken
  let userId
  let userName
  let newUserName
  let newUserId
  let newAuthToken

  beforeEach(async function () {
    userId = await addUser(defaultUser)
    authToken = authService.generateAuthToken({ userId })
    userName = await usersUtils.getUsername(userId)
  })

  afterEach(async function () {
    await cleanDb()
  })

  describe('Check /wallet', function () {
    it('Should return userId and wallet information', function (done) {
      chai
        .request(app)
        .get('/wallet')
        .set('cookie', `${cookieName}=${authToken}`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }

          expect(response).to.have.status(200)
          expect(response.body).to.be.a('object')
          expect(response.body).to.have.all.keys(...walletBodyKeys)
          expect(response.body.message).to.be.equal('Wallet returned successfully for user')
          expect(response.body.wallet).to.be.a('object')
          expect(response.body.wallet).to.have.all.keys(...walletKeys)
          expect(response.body.wallet.data).to.have.all.keys(...walletDataKeys)

          return done()
        })
    })
  })

  describe('GET /wallet/:username of own username', function () {
    it('Should return the user their own wallet', function (done) {
      chai
        .request(app)
        .get('/wallet/')
        .set('cookie', `${cookieName}=${authToken}`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }

          expect(response).to.have.status(200)
          expect(response.body.wallet.data.userId).to.be.equal(userId)

          return done()
        })
    })
  })

  describe('Check if the newly created wallet (by default we create a wallet for the new user) for the new user is pre-loader with 1000 dineros', function () {
    it('Should return the user their own wallet with 1000 dineros', function (done) {
      chai
        .request(app)
        .get('/wallet/')
        .set('cookie', `${cookieName}=${authToken}`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }

          expect(response).to.have.status(200)
          expect(response.body.wallet.data.currencies.dinero).to.be.equal(1000)

          return done()
        })
    })
  })

  describe('GET /wallet/:username of different user by an unauthorized user', function () {
    before(async function () {
      newUserId = await addUser(newUser)
      newAuthToken = authService.generateAuthToken({ newUserId })
      newUserName = await usersUtils.getUsername(newUserId)
    })

    it('Should return unauthorized when trying to access someone else\'s wallet when not authorized', function (done) {
      chai
        .request(app)
        .get(`/wallet/${newUserName}`)
        .set('cookie', `${cookieName}=${authToken}`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response).to.have.status(401)
          expect(response.body.error).to.be.equal('Unauthorized')
          expect(response.body.message).to.be.equal('You are not authorized for this action.')

          return done()
        })
    })
  })

  describe('GET /wallet/:username of a different user by an authorized user', function () {
    before(async function () {
      newUserId = await addUser(superUser)
      newAuthToken = authService.generateAuthToken({ newUserId })
      newUserName = await usersUtils.getUsername(newUserId)
    })

    it('Should return wallet when trying to access someone else\'s wallet, using authorized user (super_user)', function (done) {
      chai
        .request(app)
        .get(`/wallet/${userName}`)
        .set('cookie', `${cookieName}=${newAuthToken}`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }

          expect(response).to.have.status(401)
          expect(response.body.error).to.be.equal('Unauthorized')
          expect(response.body.message).to.be.equal('You are not authorized for this action.')

          return done()
        })
    })
  })
})
