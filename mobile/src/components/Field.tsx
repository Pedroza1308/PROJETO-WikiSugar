import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useFontScale } from '../store/AppContext';
import { colors, fonts, radius } from '../theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

export interface FieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  rightIcon?: IconName;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
  /** Control height (default 54). */
  height?: number;
  ref?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

export function Field({
  label,
  icon,
  rightIcon,
  suffix,
  containerStyle,
  multiline,
  height = 54,
  onFocus,
  onBlur,
  style,
  ref,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const scale = useFontScale();
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Txt size={15} weight={700} color={colors.ink} nativeID={rest.nativeID ? `${rest.nativeID}-label` : undefined}>
          {label}
        </Txt>
      ) : null}
      <View style={[styles.ring, focused && styles.ringFocused]}>
        <View
          style={[
            styles.control,
            { minHeight: multiline ? 110 : height },
            multiline && styles.multiline,
            focused && styles.controlFocused,
          ]}
        >
          {icon ? <Icon name={icon} size={20} color={colors.muted} /> : null}
          <TextInput
            ref={ref}
            placeholderTextColor="#8D8E94"
            accessibilityLabel={rest.accessibilityLabel ?? label}
            {...rest}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, { fontSize: 16 * scale }, multiline && styles.inputMultiline, style]}
          />
          {suffix ? (
            <Txt size={14} color={colors.muted}>
              {suffix}
            </Txt>
          ) : null}
          {rightIcon ? <Icon name={rightIcon} size={20} color={colors.muted} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  ring: { borderRadius: radius.field + 3, padding: 3, margin: -3 },
  ringFocused: { backgroundColor: colors.primarySoft },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.field,
    paddingHorizontal: 14,
  },
  controlFocused: { borderColor: colors.primary },
  multiline: { alignItems: 'flex-start', paddingVertical: 12 },
  input: {
    flex: 1,
    fontFamily: fonts.semibold,
    color: colors.ink,
    paddingVertical: 0,
    minHeight: 44,
  },
  inputMultiline: { minHeight: 86 },
});
