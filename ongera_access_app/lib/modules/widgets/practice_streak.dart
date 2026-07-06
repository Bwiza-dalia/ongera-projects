import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/core/theme/app_colors.dart';

// ─────────────────────────────────────────────
//  Data model
// ─────────────────────────────────────────────
enum DayStatus { completed, today, upcoming }

class StreakDay {
  final String shortLabel; // "S", "M", …
  final String fullLabel;  // "Sun", "Mon", …
  final DayStatus status;

  const StreakDay({
    required this.shortLabel,
    required this.fullLabel,
    required this.status,
  });
}

// ─────────────────────────────────────────────
//  Widget
// ─────────────────────────────────────────────
class PracticeStreakCard extends StatelessWidget {
  /// Number of consecutive completed days shown as the streak count.
  final int streakCount;

  /// Which week of the programme the patient is on, e.g. 4.
  final int currentWeek;

  /// The seven days to display (Sun → Sat).
  final List<StreakDay> days;

  /// Optional motivational line shown in the footer.
  final String? motivationText;

  const PracticeStreakCard({
    super.key,
    required this.streakCount,
    required this.currentWeek,
    required this.days,
    this.motivationText,
  }) : assert(days.length == 7, 'Exactly 7 days are required (Sun–Sat).');

  @override
  Widget build(BuildContext context) {
    // final isTablet = MediaQuery.of(context).size.shortestSide >= 600;
    final isTablet = false;

    return Container(
      width: 300,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'home.streak_title'.tr,
                style: TextStyle(
                  fontSize: isTablet ? 13 : 12,
                  fontWeight: FontWeight.w500,
                ),
              )
            ],
          ),

          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: days
                .map((d) => Expanded(
              child: _DayDot(
                day: d,
                compact: !isTablet,
              ),
            ))
                .toList(),
          ),

          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  Individual day dot
// ─────────────────────────────────────────────
class _DayDot extends StatelessWidget {
  final StreakDay day;
  final bool compact;

  const _DayDot({required this.day, required this.compact});

  @override
  Widget build(BuildContext context) {
    final size = compact ? 26.0 : 32.0;

    Color bgColor;
    Color fgColor;
    Widget child;

    switch (day.status) {
      case DayStatus.completed:
        bgColor = AppColors.mintGreen;
        fgColor = Colors.white;
        child = Icon(Icons.check_rounded, size: compact ? 14 : 16, color: fgColor);
        break;

      case DayStatus.today:
        bgColor = AppColors.mintGreenLight;
        fgColor = AppColors.mintGreen;
        child = Text(
          day.shortLabel,
          style: TextStyle(
            fontSize: compact ? 10 : 11,
            fontWeight: FontWeight.w500,
            color: fgColor,
          ),
        );
        break;

      case DayStatus.upcoming:
        bgColor = AppColors.streakEmpty;
        fgColor = AppColors.streakEmptyText;
        child = Text(
          day.shortLabel,
          style: TextStyle(
            fontSize: compact ? 10 : 11,
            fontWeight: FontWeight.w500,
            color: fgColor,
          ),
        );
        break;
    }

    // Today gets an outline ring
    final bool isToday = day.status == DayStatus.today;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
            border: isToday
                ? Border.all(color: AppColors.mintGreen, width: 1.5)
                : null,
          ),
          alignment: Alignment.center,
          child: child,
        ),
        const SizedBox(height: 4),
        Text(
          // Show "Today" label below today's circle
          isToday ? 'home.streak_today'.tr : (compact ? day.shortLabel : day.fullLabel),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: compact ? 8 : 9,
            fontWeight: isToday ? FontWeight.w500 : FontWeight.normal,
            color: isToday ? AppColors.mintGreen : AppColors.streakEmptyText,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  Sample data helper — call this to get a
//  realistic week based on today's date.
// ─────────────────────────────────────────────
List<StreakDay> buildSampleWeek() {
  final now = DateTime.now();
  final todayIndex = now.weekday % 7;

  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const fullLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return List.generate(7, (i) {
    final status = i < todayIndex
        ? DayStatus.completed
        : i == todayIndex
            ? DayStatus.today
            : DayStatus.upcoming;

    return StreakDay(
      shortLabel: labels[i],
      fullLabel: fullLabels[i],
      status: status,
    );
  });
}