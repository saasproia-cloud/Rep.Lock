import Expo
import React
import ReactAppDependencyProvider
import ImageIO
import Vision
import VisionCamera

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    PoseLandmarkerPluginRegistrar.registerIfNeeded()

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

private enum PoseLandmarkerPluginRegistrar {
  private static var hasRegistered = false

  static func registerIfNeeded() {
    guard !hasRegistered else { return }
    hasRegistered = true

    FrameProcessorPluginRegistry.addFrameProcessorPlugin("poseLandmarker") { proxy, options in
      return PoseLandmarkerFrameProcessorPlugin(proxy: proxy, options: options)
    }
  }
}

private final class PoseLandmarkerFrameProcessorPlugin: FrameProcessorPlugin {
  private enum MediapipeIndex: Int {
    case nose = 0
    case leftEye = 2
    case rightEye = 5
    case leftEar = 7
    case rightEar = 8
    case leftShoulder = 11
    case rightShoulder = 12
    case leftElbow = 13
    case rightElbow = 14
    case leftWrist = 15
    case rightWrist = 16
    case leftHip = 23
    case rightHip = 24
    case leftKnee = 25
    case rightKnee = 26
    case leftAnkle = 27
    case rightAnkle = 28
  }

  private static let landmarkCount = 33
  private static let minPointConfidence: Float = 0.12
  private let request: VNDetectHumanBodyPoseRequest = {
    let value = VNDetectHumanBodyPoseRequest()
    value.maximumHumanCount = 1
    return value
  }()

  override func callback(_ frame: Frame!, withArguments _: [AnyHashable: Any]!) -> Any! {
    guard let frame else { return nil }

    let orientation = Self.toImageOrientation(frame.orientation, mirrored: frame.isMirrored)
    let requestHandler = VNImageRequestHandler(cmSampleBuffer: frame.buffer, orientation: orientation, options: [:])

    do {
      try requestHandler.perform([request])
    } catch {
      return nil
    }

    guard let observation = request.results?.first else {
      return nil
    }
    guard let points = try? observation.recognizedPoints(.all) else {
      return nil
    }

    var landmarks = Array(repeating: Self.zeroLandmark(), count: Self.landmarkCount)
    var confidences: [Double] = []

    Self.writePoint(points[.nose], to: &landmarks, at: .nose, confidences: &confidences)
    Self.writePoint(points[.leftEye], to: &landmarks, at: .leftEye, confidences: &confidences)
    Self.writePoint(points[.rightEye], to: &landmarks, at: .rightEye, confidences: &confidences)
    Self.writePoint(points[.leftEar], to: &landmarks, at: .leftEar, confidences: &confidences)
    Self.writePoint(points[.rightEar], to: &landmarks, at: .rightEar, confidences: &confidences)
    Self.writePoint(points[.leftShoulder], to: &landmarks, at: .leftShoulder, confidences: &confidences)
    Self.writePoint(points[.rightShoulder], to: &landmarks, at: .rightShoulder, confidences: &confidences)
    Self.writePoint(points[.leftElbow], to: &landmarks, at: .leftElbow, confidences: &confidences)
    Self.writePoint(points[.rightElbow], to: &landmarks, at: .rightElbow, confidences: &confidences)
    Self.writePoint(points[.leftWrist], to: &landmarks, at: .leftWrist, confidences: &confidences)
    Self.writePoint(points[.rightWrist], to: &landmarks, at: .rightWrist, confidences: &confidences)
    Self.writePoint(points[.leftHip], to: &landmarks, at: .leftHip, confidences: &confidences)
    Self.writePoint(points[.rightHip], to: &landmarks, at: .rightHip, confidences: &confidences)
    Self.writePoint(points[.leftKnee], to: &landmarks, at: .leftKnee, confidences: &confidences)
    Self.writePoint(points[.rightKnee], to: &landmarks, at: .rightKnee, confidences: &confidences)
    Self.writePoint(points[.leftAnkle], to: &landmarks, at: .leftAnkle, confidences: &confidences)
    Self.writePoint(points[.rightAnkle], to: &landmarks, at: .rightAnkle, confidences: &confidences)

    let confidence = confidences.isEmpty ? 0.0 : confidences.reduce(0, +) / Double(confidences.count)

    return [
      "landmarks": landmarks,
      "confidence": confidence,
      "timestampMs": frame.timestamp
    ]
  }

  private static func writePoint(
    _ recognizedPoint: VNRecognizedPoint?,
    to landmarks: inout [[String: Double]],
    at index: MediapipeIndex,
    confidences: inout [Double]
  ) {
    guard let point = recognizedPoint else { return }
    guard point.confidence >= minPointConfidence else { return }

    let confidence = Double(point.confidence)
    landmarks[index.rawValue] = [
      "x": Double(point.location.x),
      "y": Double(1 - point.location.y),
      "z": 0.0,
      "visibility": confidence,
      "presence": confidence
    ]
    confidences.append(confidence)
  }

  private static func zeroLandmark() -> [String: Double] {
    return [
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "visibility": 0.0,
      "presence": 0.0
    ]
  }

  private static func toImageOrientation(_ orientation: UIImage.Orientation, mirrored: Bool) -> CGImagePropertyOrientation {
    switch (orientation, mirrored) {
    case (.up, false):
      return .up
    case (.up, true):
      return .upMirrored
    case (.down, false):
      return .down
    case (.down, true):
      return .downMirrored
    case (.left, false):
      return .left
    case (.left, true):
      return .leftMirrored
    case (.right, false):
      return .right
    case (.right, true):
      return .rightMirrored
    case (.upMirrored, _):
      return .upMirrored
    case (.downMirrored, _):
      return .downMirrored
    case (.leftMirrored, _):
      return .leftMirrored
    case (.rightMirrored, _):
      return .rightMirrored
    @unknown default:
      return mirrored ? .upMirrored : .up
    }
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
