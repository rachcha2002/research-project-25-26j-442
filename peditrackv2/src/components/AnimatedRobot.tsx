import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type RobotState = 'idle' | 'listening' | 'thinking' | 'talking';

interface AnimatedRobotProps {
    state: RobotState;
    size?: number;
}

export const AnimatedRobot: React.FC<AnimatedRobotProps> = ({ state, size = 180 }) => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const eyeBlinkAnim = useRef(new Animated.Value(1)).current;
    const mouthScaleAnim = useRef(new Animated.Value(1)).current;
    const wiggleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        bounceAnim.stopAnimation();
        glowAnim.stopAnimation();
        mouthScaleAnim.stopAnimation();
        wiggleAnim.stopAnimation();

        switch (state) {
            case 'listening':
                // Excited bounce
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
                    ])
                ).start();
                // Wiggle
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(wiggleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                        Animated.timing(wiggleAnim, { toValue: -1, duration: 800, useNativeDriver: true }),
                    ])
                ).start();
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
                    ])
                ).start();
                break;

            case 'thinking':
                // Fast bounce
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(bounceAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                    ])
                ).start();
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                        Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                    ])
                ).start();
                break;

            case 'talking':
                // Mouth animation
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(mouthScaleAnim, { toValue: 1.3, duration: 250, useNativeDriver: true }),
                        Animated.timing(mouthScaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
                    ])
                ).start();
                // Happy bounce
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
                        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                    ])
                ).start();
                break;

            default:
                // Gentle breathing
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
                        Animated.timing(bounceAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
                    ])
                ).start();
                break;
        }

        const blinkInterval = setInterval(() => {
            Animated.sequence([
                Animated.timing(eyeBlinkAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.timing(eyeBlinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start();
        }, 3000);

        return () => clearInterval(blinkInterval);
    }, [state]);

    const bounceTransform = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
    const wiggleTransform = wiggleAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

    const getColors = () => {
        switch (state) {
            case 'listening': return { body: ['#A8E6CF', '#7DD3C0', '#5FB8A8'], accent: '#4A9B8E', eye: '#5FB8A8' };
            case 'thinking': return { body: ['#FFE5B4', '#FFD699', '#FFB84D'], accent: '#F57C00', eye: '#FFA726' };
            case 'talking': return { body: ['#D4C5F9', '#B8A9E8', '#9B8FD8'], accent: '#6B5FCC', eye: '#8B7FE8' };
            default: return { body: ['#A8D8FF', '#7FC7FF', '#5AB3FF'], accent: '#3A8FD8', eye: '#5AB3FF' };
        }
    };

    const colors = getColors();

    return (
        <Animated.View style={[styles.container, {
            width: size,
            height: size * 1.1,
            transform: [
                { translateY: bounceTransform },
                { rotate: wiggleTransform }
            ]
        }]}>
            {/* Glow */}
            <Animated.View style={[styles.glow, { opacity: glowOpacity, shadowColor: colors.eye }]} />

            {/* Main body - capsule shape like Minion */}
            <View style={styles.bodyWrapper}>
                <LinearGradient
                    colors={colors.body as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.bodyGradient}
                >
                    {/* Body shine */}
                    <View style={styles.bodyShine} />

                    {/* Top antenna */}
                    <View style={styles.antennaTop}>
                        <View style={styles.antennaStick} />
                        <Animated.View style={[styles.antennaBall, { backgroundColor: colors.accent, opacity: glowOpacity }]}>
                            <View style={styles.ballShine} />
                        </Animated.View>
                    </View>

                    {/* Goggle strap */}
                    <View style={[styles.goggleStrap, { backgroundColor: colors.accent }]} />

                    {/* Goggles - Minion style! */}
                    <View style={styles.gogglesContainer}>
                        <View style={styles.goggles}>
                            {/* Left goggle */}
                            <View style={styles.goggle}>
                                <View style={styles.goggleFrame}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                                        style={styles.goggleLens}
                                    >
                                        <Animated.View style={[styles.eyeContainer, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                                            <View style={styles.eyeWhite}>
                                                <View style={styles.iris}>
                                                    <View style={styles.pupil} />
                                                    <View style={styles.eyeShine} />
                                                </View>
                                            </View>
                                        </Animated.View>
                                    </LinearGradient>
                                </View>
                            </View>

                            {/* Right goggle */}
                            <View style={styles.goggle}>
                                <View style={styles.goggleFrame}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                                        style={styles.goggleLens}
                                    >
                                        <Animated.View style={[styles.eyeContainer, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                                            <View style={styles.eyeWhite}>
                                                <View style={styles.iris}>
                                                    <View style={styles.pupil} />
                                                    <View style={styles.eyeShine} />
                                                </View>
                                            </View>
                                        </Animated.View>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Cute smile */}
                    <Animated.View style={[styles.mouthContainer, { transform: [{ scaleX: mouthScaleAnim }] }]}>
                        <View style={styles.smile}>
                            <View style={styles.smileLine} />
                            {/* Teeth */}
                            <View style={styles.teeth}>
                                <View style={styles.tooth} />
                                <View style={styles.tooth} />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Overalls/Chest panel */}
                    <View style={styles.overalls}>
                        <View style={[styles.overallsTop, { backgroundColor: colors.accent }]}>
                            {/* Pocket */}
                            <View style={styles.pocket}>
                                <View style={styles.pocketFlap} />
                                <Animated.View style={[styles.pocketLight, { backgroundColor: colors.eye, opacity: glowOpacity }]} />
                            </View>
                        </View>
                        {/* Straps */}
                        <View style={styles.straps}>
                            <View style={[styles.strap, styles.leftStrap, { backgroundColor: colors.accent }]} />
                            <View style={[styles.strap, styles.rightStrap, { backgroundColor: colors.accent }]} />
                        </View>
                    </View>

                    {/* Arms */}
                    <View style={styles.armsContainer}>
                        <View style={[styles.arm, styles.leftArm, { backgroundColor: colors.accent }]}>
                            <View style={styles.armGlove} />
                        </View>
                        <View style={[styles.arm, styles.rightArm, { backgroundColor: colors.accent }]}>
                            <View style={styles.armGlove} />
                        </View>
                    </View>

                    {/* Feet */}
                    <View style={styles.feetContainer}>
                        <View style={[styles.foot, { backgroundColor: colors.accent }]}>
                            <View style={styles.shoe} />
                        </View>
                        <View style={[styles.foot, { backgroundColor: colors.accent }]}>
                            <View style={styles.shoe} />
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Shadow */}
            <View style={styles.shadow} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    glow: { position: 'absolute', width: '120%', height: '120%', borderRadius: 100, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 25, elevation: 12 },

    bodyWrapper: { width: '100%', height: '100%' },
    bodyGradient: { width: '100%', height: '100%', borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10, overflow: 'visible', alignItems: 'center' },
    bodyShine: { position: 'absolute', top: '15%', left: '20%', width: '35%', height: '25%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 50, transform: [{ rotate: '-30deg' }] },

    // Antenna
    antennaTop: { position: 'absolute', top: -18, alignItems: 'center', zIndex: 10 },
    antennaStick: { width: 3, height: 18, backgroundColor: '#666', borderRadius: 2 },
    antennaBall: { width: 12, height: 12, borderRadius: 6, marginTop: -2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
    ballShine: { position: 'absolute', top: 2, left: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', opacity: 0.8 },

    // Goggles
    goggleStrap: { position: 'absolute', top: '22%', width: '95%', height: 8, borderRadius: 4, zIndex: 1 },
    gogglesContainer: { position: 'absolute', top: '18%', zIndex: 2 },
    goggles: { flexDirection: 'row', gap: 8 },
    goggle: { alignItems: 'center', justifyContent: 'center' },
    goggleFrame: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#555', padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
    goggleLens: { width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    eyeContainer: { alignItems: 'center', justifyContent: 'center' },
    eyeWhite: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    iris: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#8B4513', alignItems: 'center', justifyContent: 'center' },
    pupil: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#000' },
    eyeShine: { position: 'absolute', top: 3, left: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', opacity: 0.9 },

    // Mouth
    mouthContainer: { position: 'absolute', top: '42%', alignItems: 'center' },
    smile: { width: 50, alignItems: 'center' },
    smileLine: { width: 45, height: 3, borderRadius: 2, backgroundColor: '#333', marginBottom: 2 },
    teeth: { flexDirection: 'row', gap: 2 },
    tooth: { width: 8, height: 6, backgroundColor: '#FFF', borderRadius: 2, borderWidth: 1, borderColor: '#DDD' },

    // Overalls
    overalls: { position: 'absolute', top: '50%', width: '85%', alignItems: 'center' },
    overallsTop: { width: '100%', height: 50, borderTopLeftRadius: 15, borderTopRightRadius: 15, alignItems: 'center', paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    pocket: { width: 30, height: 25, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    pocketFlap: { position: 'absolute', top: 2, width: 24, height: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 },
    pocketLight: { width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 },
    straps: { position: 'absolute', top: -10, width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15 },
    strap: { width: 12, height: 35, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    leftStrap: { transform: [{ rotate: '-5deg' }] },
    rightStrap: { transform: [{ rotate: '5deg' }] },

    // Arms
    armsContainer: { position: 'absolute', top: '55%', width: '110%', flexDirection: 'row', justifyContent: 'space-between' },
    arm: { width: 14, height: 45, borderRadius: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    leftArm: { marginLeft: -7, transform: [{ rotate: '-12deg' }] },
    rightArm: { marginRight: -7, transform: [{ rotate: '12deg' }] },
    armGlove: { position: 'absolute', bottom: -3, left: '50%', marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: '#333' },

    // Feet
    feetContainer: { position: 'absolute', bottom: -8, flexDirection: 'row', gap: 18 },
    foot: { width: 20, height: 18, borderTopLeftRadius: 10, borderTopRightRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    shoe: { position: 'absolute', bottom: -4, left: -2, width: 24, height: 10, borderRadius: 5, backgroundColor: '#333' },

    shadow: { position: 'absolute', bottom: -18, width: '70%', height: 12, borderRadius: 6, backgroundColor: '#000', opacity: 0.2 },
});
