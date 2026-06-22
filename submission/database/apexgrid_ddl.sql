--
-- PostgreSQL database dump
--

\restrict 6axThDAb9a5gNLAa0afBGi3gfnK2H8USRhnrIzPTZbCJYfEmJLDdNx26rp4AiYr

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: set_booking_expiry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_booking_expiry() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.expired_at = NEW.created_at + INTERVAL '30 minutes';
    RETURN NEW;
END;
$$;


--
-- Name: update_race_quota(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_race_quota() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    -- Reduce quota when booking confirmed
    IF OLD.status = 'PENDING'
       AND NEW.status = 'CONFIRMED' THEN

        UPDATE races
        SET available_quota = available_quota - NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    -- Restore quota ONLY if previously confirmed
    IF OLD.status = 'CONFIRMED'
       AND NEW.status = 'CANCELLED' THEN

        UPDATE races
        SET available_quota = available_quota + NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    booking_code character varying(20) NOT NULL,
    user_id integer NOT NULL,
    race_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    ticket_pdf_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expired_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    scanned_at timestamp without time zone,
    cancellation_reason character varying(255),
    zone character varying(10) DEFAULT 'GA'::character varying,
    user_email character varying(100),
    user_full_name character varying(100),
    username character varying(50),
    CONSTRAINT chk_quantity CHECK ((quantity > 0)),
    CONSTRAINT chk_total_price CHECK ((total_price >= (0)::numeric))
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: circuits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.circuits (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    length_km numeric(6,3),
    number_of_laps integer,
    lap_record character varying(50),
    lap_record_holder character varying(100),
    image_url text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: circuits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.circuits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: circuits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.circuits_id_seq OWNED BY public.circuits.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    recipient_email character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body text,
    email_type character varying(50) DEFAULT 'BOOKING_CONFIRMATION'::character varying,
    booking_id integer,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    retry_count integer DEFAULT 0,
    sent_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expired_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: races; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.races (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    circuit_id integer NOT NULL,
    race_date timestamp without time zone NOT NULL,
    race_time time without time zone,
    season integer DEFAULT 2026 NOT NULL,
    round integer,
    total_quota integer DEFAULT 1000 NOT NULL,
    available_quota integer DEFAULT 1000 NOT NULL,
    ticket_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    description text,
    status character varying(20) DEFAULT 'UPCOMING'::character varying,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price CHECK ((ticket_price >= (0)::numeric)),
    CONSTRAINT chk_quota CHECK (((available_quota >= 0) AND (available_quota <= total_quota)))
);


--
-- Name: races_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.races_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: races_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.races_id_seq OWNED BY public.races.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    role_id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_admin_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_admin_statistics AS
 SELECT count(*) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)) AS total_confirmed_bookings,
    count(*) FILTER (WHERE ((b.status)::text = 'PENDING'::text)) AS total_pending_bookings,
    count(*) FILTER (WHERE ((b.status)::text = 'CANCELLED'::text)) AS total_cancelled_bookings,
    COALESCE(sum(b.total_price) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::numeric) AS total_revenue,
    COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) AS total_tickets_sold,
    count(DISTINCT b.user_id) AS total_unique_customers
   FROM public.bookings b;


--
-- Name: v_booking_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_booking_summary AS
 SELECT b.id,
    b.booking_code,
    b.user_id,
    b.race_id,
    b.quantity,
    b.total_price,
    b.status,
    b.created_at,
    b.expired_at,
    r.name AS race_name,
    r.race_date,
    c.name AS circuit_name,
    c.country
   FROM ((public.bookings b
     JOIN public.races r ON ((b.race_id = r.id)))
     JOIN public.circuits c ON ((r.circuit_id = c.id)));


--
-- Name: v_race_popularity; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_race_popularity AS
 SELECT r.id AS race_id,
    r.name AS race_name,
    c.name AS circuit_name,
    c.country,
    r.race_date,
    r.total_quota,
    r.available_quota,
    COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) AS tickets_sold,
    COALESCE(sum(b.total_price) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::numeric) AS revenue,
    count(b.id) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)) AS confirmed_bookings
   FROM ((public.races r
     JOIN public.circuits c ON ((r.circuit_id = c.id)))
     LEFT JOIN public.bookings b ON ((b.race_id = r.id)))
  GROUP BY r.id, r.name, c.name, c.country, r.race_date, r.total_quota, r.available_quota
  ORDER BY COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) DESC;


--
-- Name: v_race_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_race_summary AS
 SELECT r.id,
    r.name,
    r.race_date,
    r.race_time,
    r.season,
    r.round,
    r.total_quota,
    r.available_quota,
    r.ticket_price,
    r.currency,
    r.status,
    c.name AS circuit_name,
    c.location,
    c.country,
    c.image_url AS circuit_image
   FROM (public.races r
     JOIN public.circuits c ON ((r.circuit_id = c.id)));


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expired_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: circuits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuits ALTER COLUMN id SET DEFAULT nextval('public.circuits_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: races id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races ALTER COLUMN id SET DEFAULT nextval('public.races_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- Name: bookings bookings_booking_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_code_key UNIQUE (booking_code);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: circuits circuits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuits
    ADD CONSTRAINT circuits_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: races races_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT races_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: refresh_tokens refresh_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_key UNIQUE (user_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_key UNIQUE (token);


--
-- Name: idx_bookings_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_code ON public.bookings USING btree (booking_code);


--
-- Name: idx_bookings_expired; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_expired ON public.bookings USING btree (expired_at) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_bookings_race; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_race ON public.bookings USING btree (race_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_email_logs_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_booking ON public.email_logs USING btree (booking_id);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_races_circuit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_circuit ON public.races USING btree (circuit_id);


--
-- Name: idx_races_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_date ON public.races USING btree (race_date);


--
-- Name: idx_races_season; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_season ON public.races USING btree (season);


--
-- Name: idx_races_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_status ON public.races USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: bookings trg_set_expiry; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_expiry BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_expiry();


--
-- Name: bookings trg_update_quota; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_quota AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.update_race_quota();


--
-- Name: races update_races_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings fk_bookings_race; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_bookings_race FOREIGN KEY (race_id) REFERENCES public.races(id) ON DELETE RESTRICT;


--
-- Name: email_logs fk_email_logs_booking; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: races fk_races_circuit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT fk_races_circuit FOREIGN KEY (circuit_id) REFERENCES public.circuits(id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens fk_refresh_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens fk_reset_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT fk_reset_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: verification_tokens fk_verif_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT fk_verif_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6axThDAb9a5gNLAa0afBGi3gfnK2H8USRhnrIzPTZbCJYfEmJLDdNx26rp4AiYr

