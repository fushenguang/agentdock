import { LinearGradient } from 'expo-linear-gradient'
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg'

export function BrandBackdrop({ includeWarmth = true }: { includeWarmth?: boolean }) {
  return (
    <>
      <LinearGradient
        colors={includeWarmth ? ['#fffdf9', '#f8f1e6', '#f8f9fb'] : ['#ffffff', '#f8f9fb']}
        locations={[0, 0.52, 1]}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <Svg
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        width="100%"
        height="100%"
      >
        <Defs>
          <RadialGradient id="brand-amber" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#d98d2d" stopOpacity="0.34" />
            <Stop offset="100%" stopColor="#d98d2d" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="brand-violet" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.19" />
            <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="brand-sky" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="14%" cy="5%" r="240" fill="url(#brand-amber)" />
        <Circle cx="92%" cy="11%" r="200" fill="url(#brand-violet)" />
        <Circle cx="76%" cy="73%" r="260" fill="url(#brand-sky)" />
      </Svg>
    </>
  )
}
