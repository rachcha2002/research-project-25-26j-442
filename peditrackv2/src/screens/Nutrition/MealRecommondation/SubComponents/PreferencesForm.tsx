import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';

type DietType = 'Standard' | 'Veg';
type BudgetLevel = 'Low' | 'Medium' | 'High';
type ActivityLevel = 'Light' | 'Moderate' | 'Active';

export type PreferencesFormValues = {
	diet_type: DietType;
	budget_level: BudgetLevel;
	meals_per_day: number;
	activity_level: ActivityLevel;
};

type PreferencesFormProps = {
	onSubmit?: (values: PreferencesFormValues) => void;
	initialValues?: Partial<PreferencesFormValues>;
};

const INITIAL_VALUES: PreferencesFormValues = {
	diet_type: 'Standard',
	budget_level: 'Medium',
	meals_per_day: 3,
	activity_level: 'Moderate',
};

export const PreferencesForm: React.FC<PreferencesFormProps> = ({ onSubmit, initialValues }) => {
	const [stepIndex, setStepIndex] = useState(0);
	const [values, setValues] = useState<PreferencesFormValues>(INITIAL_VALUES);
		useEffect(() => {
			if (!initialValues) {
				return;
			}

			setValues((prev) => ({
				...prev,
				...initialValues,
			}));
			setStepIndex(0);
		}, [initialValues]);

	const dietOptions: { label: 'Veg' | 'Non-Veg'; value: DietType }[] = [
		{ label: 'Veg', value: 'Veg' },
		{ label: 'Non-Veg', value: 'Standard' },
	];

	const steps = useMemo(
		() => [
			{
				key: 'diet_type' as const,
				title: 'What is your child’s diet type?',
			},
			{
				key: 'budget_level' as const,
				title: 'What is your meal budget level?',
				options: ['Low', 'Medium', 'High'] as BudgetLevel[],
			},
			{
				key: 'meals_per_day' as const,
				title: 'How many meals per day?',
			},
			{
				key: 'activity_level' as const,
				title: 'How active is your child?',
				options: ['Light', 'Moderate', 'Active'] as ActivityLevel[],
			},
		],
		[],
	);

	const currentStep = steps[stepIndex];
	const isLastStep = stepIndex === steps.length - 1;

	const setOption = (key: 'diet_type' | 'budget_level' | 'activity_level', value: string) => {
		setValues((prev) => ({ ...prev, [key]: value } as PreferencesFormValues));
	};

	const handleSubmit = () => {
		if (onSubmit) {
			onSubmit(values);
			return;
		}

		Alert.alert(
			'Preferences saved',
			`Diet: ${values.diet_type}\nBudget: ${values.budget_level}\nMeals/day: ${values.meals_per_day}\nActivity: ${values.activity_level}`,
		);
	};

	return (
		<View style={styles.card}>
			<Text style={styles.stepText}>
				Step {stepIndex + 1} of {steps.length}
			</Text>
			<Text style={styles.question}>{currentStep.title}</Text>

			{currentStep.key === 'diet_type' && (
				<View style={styles.optionsWrap}>
					{dietOptions.map((option) => {
						const selected = values.diet_type === option.value;
						return (
							<TouchableOpacity
								key={option.label}
								style={[styles.optionButton, selected && styles.optionButtonSelected]}
								onPress={() => setOption('diet_type', option.value)}
								activeOpacity={0.8}
							>
								<Text style={[styles.optionText, selected && styles.optionTextSelected]}>
									{option.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			{currentStep.key === 'budget_level' && (
				<View style={styles.optionsWrap}>
					{currentStep.options.map((option) => {
						const selected = values.budget_level === option;
						return (
							<TouchableOpacity
								key={option}
								style={[styles.optionButton, selected && styles.optionButtonSelected]}
								onPress={() => setOption('budget_level', option)}
								activeOpacity={0.8}
							>
								<Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			{currentStep.key === 'meals_per_day' && (
				<View style={styles.counterWrap}>
					<TouchableOpacity
						style={styles.counterButton}
						onPress={() =>
							setValues((prev) => ({
								...prev,
								meals_per_day: Math.max(1, prev.meals_per_day - 1),
							}))
						}
						activeOpacity={0.8}
					>
						<Text style={styles.counterButtonText}>-</Text>
					</TouchableOpacity>

					<Text style={styles.counterValue}>{values.meals_per_day}</Text>

					<TouchableOpacity
						style={styles.counterButton}
						onPress={() =>
							setValues((prev) => ({
								...prev,
								meals_per_day: Math.min(5, prev.meals_per_day + 1),
							}))
						}
						activeOpacity={0.8}
					>
						<Text style={styles.counterButtonText}>+</Text>
					</TouchableOpacity>
				</View>
			)}

			{currentStep.key === 'activity_level' && (
				<View style={styles.optionsWrap}>
					{currentStep.options.map((option) => {
						const selected = values.activity_level === option;
						return (
							<TouchableOpacity
								key={option}
								style={[styles.optionButton, selected && styles.optionButtonSelected]}
								onPress={() => setOption('activity_level', option)}
								activeOpacity={0.8}
							>
								<Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			<View style={styles.footerRow}>
				<TouchableOpacity
					style={[styles.navButton, stepIndex === 0 && styles.navButtonDisabled]}
					disabled={stepIndex === 0}
					onPress={() => setStepIndex((prev) => Math.max(0, prev - 1))}
					activeOpacity={0.8}
				>
					<Text style={[styles.navButtonText, stepIndex === 0 && styles.navButtonTextDisabled]}>
						Previous
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.navButton, styles.navButtonPrimary]}
					onPress={() => {
						if (isLastStep) {
							handleSubmit();
							return;
						}
						setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
					}}
					activeOpacity={0.8}
				>
					<Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>
						{isLastStep ? 'Finish' : 'Next'}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: Colors.white,
		marginHorizontal: 16,
		marginTop: 16,
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	stepText: {
		color: Colors.inactive,
		fontSize: 12,
		marginBottom: 6,
	},
	question: {
		color: Colors.dark,
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 14,
	},
	optionsWrap: {
		gap: 10,
	},
	optionButton: {
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 14,
		backgroundColor: Colors.white,
	},
	optionButtonSelected: {
		borderColor: Colors.primary.DEFAULT,
		backgroundColor: '#F5F3FF',
	},
	optionText: {
		color: Colors.dark,
		fontSize: 14,
		fontWeight: '500',
	},
	optionTextSelected: {
		color: Colors.primary.DEFAULT,
	},
	counterWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		marginVertical: 8,
	},
	counterButton: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: Colors.gray.light,
		alignItems: 'center',
		justifyContent: 'center',
	},
	counterButtonText: {
		fontSize: 24,
		lineHeight: 26,
		color: Colors.dark,
		fontWeight: '600',
	},
	counterValue: {
		minWidth: 36,
		textAlign: 'center',
		fontSize: 26,
		fontWeight: '700',
		color: Colors.dark,
	},
	footerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		marginTop: 20,
	},
	navButton: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.gray.light,
	},
	navButtonPrimary: {
		backgroundColor: Colors.primary.DEFAULT,
	},
	navButtonDisabled: {
		opacity: 0.5,
	},
	navButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.dark,
	},
	navButtonPrimaryText: {
		color: Colors.white,
	},
	navButtonTextDisabled: {
		color: Colors.inactive,
	},
});
