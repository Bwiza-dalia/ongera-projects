import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/modules/widgets/module_app_bar.dart';
import 'package:video_player/video_player.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Reusable pre-exercise intro screen.
///
/// Shows a full-height video on the left and a short prompt + CTA on the right.
/// Only [title] and [videoAsset] change per module; all other copy is generic.
class ExerciseIntroScreen extends StatelessWidget {
  const ExerciseIntroScreen({
    super.key,
    required this.title,
    required this.videoAsset,
    required this.onBegin,
    this.accentColor = AppColors.therapyBlue,
  });

  final String title;
  final String videoAsset;
  final VoidCallback onBegin;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ModuleAppBar(title: title, hideProgress: true, hideSettings: true),
      body: Row(
        children: [
          // ── Left — video player (dominant) ───────────────────────────────
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.only(left: 16.0, bottom: 16),
              child: _VideoPlayer(
                assetPath: videoAsset,
                accentColor: accentColor,
              ),
            ),
          ),

          // ── Right — prompt + begin ────────────────────────────────────────
          Expanded(
            flex: 2,
            child: _SidePanel(
              accentColor: accentColor,
              onBegin: onBegin,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Side panel ────────────────────────────────────────────────────────────────

class _SidePanel extends StatelessWidget {
  const _SidePanel({
    required this.accentColor,
    required this.onBegin,
  });

  final Color accentColor;
  final VoidCallback onBegin;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.pureWhite,
      padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.ondemand_video_rounded, color: accentColor, size: 26),
          ),
          const SizedBox(height: 20),

          Text(
            'exercise.intro_body'.tr,
            style: AppText.body.copyWith(color: AppColors.mutedText, height: 1.65),
          ),

          const Spacer(),

          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onBegin,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.mintGreen,
                foregroundColor: AppColors.navyObsidian,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              icon: const Icon(Icons.arrow_forward_rounded, size: 20),
              iconAlignment: IconAlignment.end,
              label: Text(
                'exercise.lets_begin'.tr,
                style: AppText.body.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Video player ──────────────────────────────────────────────────────────────

class _VideoPlayer extends StatefulWidget {
  const _VideoPlayer({required this.assetPath, required this.accentColor});

  final String assetPath;
  final Color accentColor;

  @override
  State<_VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<_VideoPlayer> {
  late final VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.asset(widget.assetPath)
      ..initialize().then((_) {
        if (mounted) setState(() => _initialized = true);
      });
    _controller.setLooping(false);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _togglePlay() {
    setState(() {
      _controller.value.isPlaying ? _controller.pause() : _controller.play();
    });
  }

  Future<void> _openFullscreen() async {
    // Pause inline before going fullscreen
    _controller.pause();

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _FullscreenVideoPage(
          controller: _controller,
          accentColor: widget.accentColor,
        ),
      ),
    );

    // Restore orientation after returning
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return ColoredBox(
        color: AppColors.navyObsidian,
        child: Center(
          child: CircularProgressIndicator(
            color: widget.accentColor,
            strokeWidth: 2.5,
          ),
        ),
      );
    }

    return ColoredBox(
      color: Colors.black,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          // Video frame — correct aspect ratio, letterboxed if needed
          Center(
            child: AspectRatio(
              aspectRatio: _controller.value.aspectRatio,
              child: VideoPlayer(_controller),
            ),
          ),

          // Controls overlay
          _VideoControls(
            controller: _controller,
            accentColor: widget.accentColor,
            onTogglePlay: _togglePlay,
            onFullscreen: _openFullscreen,
          ),
        ],
      ),
    );
  }
}

// ── Fullscreen page ───────────────────────────────────────────────────────────

class _FullscreenVideoPage extends StatefulWidget {
  const _FullscreenVideoPage({
    required this.controller,
    required this.accentColor,
  });

  final VideoPlayerController controller;
  final Color accentColor;

  @override
  State<_FullscreenVideoPage> createState() => _FullscreenVideoPageState();
}

class _FullscreenVideoPageState extends State<_FullscreenVideoPage> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    widget.controller.play();
  }

  @override
  void dispose() {
    // System UI is restored by the caller after pop
    super.dispose();
  }

  void _togglePlay() {
    setState(() {
      widget.controller.value.isPlaying
          ? widget.controller.pause()
          : widget.controller.play();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Center(
            child: AspectRatio(
              aspectRatio: widget.controller.value.aspectRatio,
              child: VideoPlayer(widget.controller),
            ),
          ),

          _VideoControls(
            controller: widget.controller,
            accentColor: widget.accentColor,
            onTogglePlay: _togglePlay,
            // Exit fullscreen button instead of expand
            onFullscreen: () => Navigator.of(context).pop(),
            isFullscreen: true,
          ),
        ],
      ),
    );
  }
}

// ── Video controls bar ────────────────────────────────────────────────────────

class _VideoControls extends StatefulWidget {
  const _VideoControls({
    required this.controller,
    required this.accentColor,
    required this.onTogglePlay,
    required this.onFullscreen,
    this.isFullscreen = false,
  });

  final VideoPlayerController controller;
  final Color accentColor;
  final VoidCallback onTogglePlay;
  final VoidCallback onFullscreen;
  final bool isFullscreen;

  @override
  State<_VideoControls> createState() => _VideoControlsState();
}

class _VideoControlsState extends State<_VideoControls> {
  // Explicit ended flag — driven by isPlaying transitions, not pos>=dur,
  // because the MP4 moov atom may report a wrong duration (e.g. 1 ms).
  bool _isEnded = false;
  bool _wasPlaying = false;
  bool _userPaused = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_rebuild);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_rebuild);
    super.dispose();
  }

  void _rebuild() {
    if (!mounted) return;
    final isPlaying = widget.controller.value.isPlaying;
    if (isPlaying) {
      // Video is running — clear any stale ended state.
      _wasPlaying = true;
      _isEnded = false;
    } else if (_wasPlaying && !_userPaused) {
      // Stopped on its own (not from user tapping pause) → treat as ended.
      _isEnded = true;
      _wasPlaying = false;
    }
    setState(() {});
  }

  void _seek(int seconds) {
    final pos = widget.controller.value.position;
    final target = pos + Duration(seconds: seconds);
    widget.controller.seekTo(
      target < Duration.zero ? Duration.zero : target,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPlaying = widget.controller.value.isPlaying;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Color(0xDD000000)],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 32, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Rewind 10 s
          _ControlButton(
            icon: Icons.replay_10_rounded,
            onTap: () => _seek(-10),
          ),
          const SizedBox(width: 16),

          // Play / pause / replay
          _ControlButton(
            icon: _isEnded
                ? Icons.replay_rounded
                : (isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
            onTap: _isEnded
                ? () {
                    setState(() {
                      _isEnded = false;
                      _userPaused = false;
                    });
                    widget.controller
                        .seekTo(Duration.zero)
                        .then((_) => widget.controller.play());
                  }
                : () {
                    // Track user-initiated pause so the listener doesn't
                    // misread it as the video ending naturally.
                    if (widget.controller.value.isPlaying) {
                      setState(() => _userPaused = true);
                    } else {
                      setState(() => _userPaused = false);
                    }
                    widget.onTogglePlay();
                  },
            large: true,
          ),
          const SizedBox(width: 16),

          // Forward 10 s
          _ControlButton(
            icon: Icons.forward_10_rounded,
            onTap: () => _seek(10),
          ),

          const Spacer(),

          // Fullscreen toggle
          _ControlButton(
            icon: widget.isFullscreen
                ? Icons.fullscreen_exit_rounded
                : Icons.fullscreen_rounded,
            onTap: widget.onFullscreen,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.onTap,
    this.large = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final size = large ? 52.0 : 38.0;
    final iconSize = large ? 28.0 : 20.0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: iconSize),
      ),
    );
  }
}
