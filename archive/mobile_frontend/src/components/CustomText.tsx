import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';

const CustomText = ({ style, ...props }: TextProps) => {
    const { colors } = useTheme();
  
    const flattenedStyle = StyleSheet.flatten(style) || {};
    const isBold = flattenedStyle.fontWeight === 'bold';
  
    return (
      <Text
        {...props}
        style={[
          {
            fontFamily: isBold ? 'GlacialIndifference-Bold' : 'GlacialIndifference-Regular',
            color: colors.text,
          },
          style,
        ]}
      />
    );
  };
  

export default CustomText;
