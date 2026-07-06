import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:video_player/video_player.dart';

import '../../core/theme/app_colors.dart';

/// Shows a bottom-to-center animated dialog containing the exercise
/// guideline video. The controller is created and disposed internally.
Future<void> showHowToDialog(
  BuildContext context, {
  required String videoAsset,
  Color accentColor = AppColors.therapyBlue,
}) {
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'comprehend.how_to_barrier'.tr,
    barrierColor: const Color(0xCC000000),
    transitionDuration: const Duration(milliseconds: 380),
    pageBuilder: (_, _, _) => _HowToDialogContent(
      videoAsset: videoAsset,
      accentColor: accentColor,
    ),
    transitionBuilder: (_, animation, _, child) {
      final slide = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 1),
          end: Offset.zero,
        ).animate(slide),
        child: FadeTransition(
          opacity: animation,
          child: child,
        ),
      );
    },
  );
}

// ── Dialog content ────────────────────────────────────────────────────────────

class _HowToDialogContent extends StatefulWidget {
  const _HowToDialogContent({
    required this.videoAsset,
    required this.accentColor,
  });

  final String videoAsset;
  final Color accentColor;

  @override
  State<_HowToDialogContent> createState() => _HowToDialogContentState();
}

class _HowToDialogContentState extends State<_HowToDialogContent> {
  late final VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.asset(widget.videoAsset)
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

  void _close() => Navigator.of(context).pop();

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return Center(
      child: SizedBox(
        width: screenSize.width * 0.72,
        height: screenSize.height * 0.78,
        child: Material(
          color: Colors.transparent,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // ── Video card ───────────────────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: widget.accentColor.withValues(alpha: 0.6),
                    width: 2,
                  ),
                ),
                clipBehavior: Clip.hardEdge,
                child: _initialized
                    ? Stack(
                        alignment: Alignment.bottomCenter,
                        children: [
                          // Video frame
                          Center(
                            child: AspectRatio(
                              aspectRatio: _controller.value.aspectRatio,
                              child: VideoPlayer(_controller),
                            ),
                          ),
                          // Controls
                          _VideoControls(
                            controller: _controller,
                            accentColor: widget.accentColor,
                            onStateChanged: () => setState(() {}),
                          ),
                        ],
                      )
                    : Center(
                        child: CircularProgressIndicator(
                          color: widget.accentColor,
                          strokeWidth: 2.5,
                        ),
                      ),
              ),

              // ── Close button — top-right corner ─────────────────────────
              Positioned(
                top: -14,
                right: -14,
                child: GestureDetector(
                  onTap: _close,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: AppColors.pureWhite,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 20,
                      color: AppColors.navyObsidian,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Video controls ────────────────────────────────────────────────────────────

class _VideoControls extends StatefulWidget {
  const _VideoControls({
    required this.controller,
    required this.accentColor,
    required this.onStateChanged,
  });

  final VideoPlayerController controller;
  final Color accentColor;
  final VoidCallback onStateChanged;

  @override
  State<_VideoControls> createState() => _VideoControlsState();
}

class _VideoControlsState extends State<_VideoControls> {
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
      _wasPlaying = true;
      _isEnded = false;
    } else if (_wasPlaying && !_userPaused) {
      _isEnded = true;
      _wasPlaying = false;
    }
    setState(() {});
    widget.onStateChanged();
  }

  void _seek(int seconds) {
    final pos = widget.controller.value.position;
    final target = pos + Duration(seconds: seconds);
    widget.controller.seekTo(
      target < Duration.zero ? Duration.zero : target,
    );
  }

  void _togglePlay() {
    if (widget.controller.value.isPlaying) {
      setState(() => _userPaused = true);
      widget.controller.pause();
    } else {
      setState(() => _userPaused = false);
      widget.controller.play();
    }
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
      padding: const EdgeInsets.fromLTRB(16, 32, 16, 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Rewind 10 s
          _CtrlBtn(
            icon: Icons.replay_10_rounded,
            onTap: () => _seek(-10),
          ),
          const SizedBox(width: 16),

          // Play / pause / replay
          _CtrlBtn(
            icon: _isEnded
                ? Icons.replay_rounded
                : (isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
            large: true,
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
                : _togglePlay,
          ),
          const SizedBox(width: 16),

          // Forward 10 s
          _CtrlBtn(
            icon: Icons.forward_10_rounded,
            onTap: () => _seek(10),
          ),
        ],
      ),
    );
  }
}

class _CtrlBtn extends StatelessWidget {
  const _CtrlBtn({required this.icon, required this.onTap, this.large = false});

  final IconData icon;
  final VoidCallback onTap;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final size = large ? 52.0 : 38.0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: large ? 28.0 : 20.0,
        ),
      ),
    );
  }
}
