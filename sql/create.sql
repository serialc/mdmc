-- Create RIZEMEET table(s)

CREATE TABLE busmov (
    dt TIMESTAMP NOT NULL,
    satnum TINYINT UNSIGNED NOT NULL,
    altitude DEC(5,1) UNSIGNED NOT NULL,
    spdknts DEC(3,1) UNSIGNED NOT NULL,
    lat DEC(8,6) SIGNED NOT NULL,
    lng DEC(9,6) SIGNED NOT NULL,
    batv DEC(4,3) UNSIGNED NOT NULL,
    busnum DEC(3,0) UNSIGNED DEFAULT NULL,
    tripcode TINYINT UNSIGNED DEFAULT NULL,
    segment TINYINT UNSIGNED DEFAULT NULL,
    visible bool DEFAULT true,
    PRIMARY KEY (dt)
);

