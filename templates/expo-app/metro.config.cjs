const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const { verifyProductionEnv } = require('./scripts/verify-production-env.cjs')

verifyProductionEnv({ productionOnly: true })

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
