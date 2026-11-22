package uz.diyor.odatlar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import com.google.android.gms.location.ActivityTransition;
import com.google.android.gms.location.ActivityTransitionEvent;
import com.google.android.gms.location.ActivityTransitionResult;
import com.google.android.gms.location.DetectedActivity;

/** Transportga chiqish/tushishda qadamlarni yozib, holatni almashtiradi. */
public class TransitionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ActivityTransitionResult.hasResult(intent)) return;
        final ActivityTransitionResult res = ActivityTransitionResult.extractResult(intent);
        if (res == null) return;
        final Context c = context.getApplicationContext();
        final PendingResult pr = goAsync();
        new Thread(() -> {
            try {
                StepReader.readAndRecord(c, 4000); // shu paytgacha bo'lgan qadamlar eski holatga yoziladi
                for (ActivityTransitionEvent ev : res.getTransitionEvents()) {
                    int a = ev.getActivityType();
                    boolean enter = ev.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER;
                    long when = System.currentTimeMillis() - (SystemClock.elapsedRealtimeNanos() - ev.getElapsedRealTimeNanos()) / 1000000L;
                    if (a == DetectedActivity.RUNNING || a == DetectedActivity.ON_BICYCLE) {
                        String type = a == DetectedActivity.RUNNING ? "run" : "bike";
                        if (enter) StepStore.sessionStart(c, type, when); else StepStore.sessionEnd(c, type, when);
                    }
                    if (a == DetectedActivity.IN_VEHICLE) {
                        StepStore.setVehicle(c, ev.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER);
                    } else if ((a == DetectedActivity.WALKING || a == DetectedActivity.RUNNING || a == DetectedActivity.ON_BICYCLE)
                        && ev.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
                        StepStore.setVehicle(c, false);
                    }
                }
            } finally {
                pr.finish();
            }
        }).start();
    }
}
