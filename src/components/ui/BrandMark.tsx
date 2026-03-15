import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

type BrandMarkProps = {
  size?: number
}

export default function BrandMark({ size = 32 }: BrandMarkProps) {
  const iconSize = Math.round(size * 0.625)

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: Math.round(size * 0.125) }]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 14l9-5-9-5-9 5 9 5z"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
