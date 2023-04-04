import * as firebaseFunctionsTest from 'firebase-functions-test';
import * as videoIntelligence from "@google-cloud/video-intelligence"
import { labelVideo } from '../src/index';

// We mock out the config here instead of setting environment variables directly
jest.mock('../src/config', () => ({
    default: {
        locationId: 'us-central1',
        inputVideosBucket: 'test-bucket',
        inputVideosPath: '/videos',
        outputUri: 'gs://test-bucket',
        outputBucket: 'test-bucket',
        outputPath: '/output',
        labelDetectionMode: 'SHOT_AND_FRAME_MODE',
        videoConfidenceThreshold: 0.5,
        frameConfidenceThreshold: 0.5,
        model: 'builtin/stable',
        stationaryCamera: true,
    }
}));

// Anything that isnt mocked will be obtained from here. It needs to be a function as jest will
// hoist mock functions to the top of the file.
const actualVideoIntelligenceModule = () => videoIntelligence

// mock to check the arguments passed to the annotateVideo function+
const mock = jest.fn();

// Mock the video intelligence  clent
jest.mock('@google-cloud/video-intelligence', () => {
    return {
        protos: {
            google: {
                cloud: {
                    videointelligence: {
                        v1: {
                            LabelDetectionMode: () => actualVideoIntelligenceModule().protos.google.cloud.videointelligence.v1.LabelDetectionMode,
                        }
                    }
                }
            }
        },
        VideoIntelligenceServiceClient: jest.fn().mockImplementation(() => {
            return {
                annotateVideo: async (args: any) => {
                    mock(args)
                    return [
                        {
                            error: null,
                        }
                    ]
                },
            }
        }
        )
    }
});




const fft = firebaseFunctionsTest();


const wrappedLabelVideo = fft.wrap(labelVideo);

describe('labelVideo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should label video', async () => {

        const testMetadata = fft.storage.makeObjectMetadata({
            name: 'videos/test.mp4',
            bucket: 'test-bucket',
            contentType: 'video/mp4',
            size: '1234',
            timeCreated: '2020-01-01T00:00:00.000Z',
        });

        await wrappedLabelVideo(testMetadata);

        const expectedArgs = {
            inputUri: 'gs://test-bucket/videos/test.mp4',
            outputUri: 'gs://test-bucket/outputtest.mp4.json',
            locationId: 'us-central1',
            features: [1],
            videoContext: {
                labelDetectionConfig: {
                    frameConfidenceThreshold: 0.5,
                    labelDetectionMode: 'SHOT_AND_FRAME_MODE',
                    model: 'builtin/stable',
                    stationaryCamera: true,
                    videoConfidenceThreshold: 0.5
                }
            }
        }

        expect(mock).toBeCalledWith(expectedArgs);
    });
});