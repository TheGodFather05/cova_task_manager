package com.taskmanager.task;

public enum Quadrant {
    DO_FIRST(Importance.IMPORTANT, Urgency.URGENT),
    SCHEDULE(Importance.IMPORTANT, Urgency.NOT_URGENT),
    DELEGATE(Importance.NOT_IMPORTANT, Urgency.URGENT),
    DROP(Importance.NOT_IMPORTANT, Urgency.NOT_URGENT);

    private final Importance importance;
    private final Urgency urgency;

    Quadrant(Importance importance, Urgency urgency) {
        this.importance = importance;
        this.urgency = urgency;
    }

    public Importance importance() {
        return importance;
    }

    public Urgency urgency() {
        return urgency;
    }

    public static Quadrant of(Importance importance, Urgency urgency) {
        for (Quadrant quadrant : values()) {
            if (quadrant.importance == importance && quadrant.urgency == urgency) {
                return quadrant;
            }
        }
        throw new IllegalArgumentException("no quadrant for " + importance + " and " + urgency);
    }
}
